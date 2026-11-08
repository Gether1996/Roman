from django.apps import AppConfig


class ViewerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'viewer'

    def ready(self):
        # Changes made in the advanced Django admin (/admin/) also go to the
        # history shown in the admin panel (História zmien).
        import json

        from django.contrib.admin.models import ADDITION, CHANGE, DELETION, LogEntry
        from django.db.models.signals import post_save

        def mirror_admin_log(sender, instance, created, **kwargs):
            if not created:
                return
            try:
                from viewer.models import AuditLog
                user = instance.user
                name = f"{getattr(user, 'name', '') or ''} {getattr(user, 'surname', '') or ''}".strip()
                action = {ADDITION: 'create', CHANGE: 'update', DELETION: 'delete'}.get(instance.action_flag, 'update')
                verb = {'create': 'pridané', 'update': 'upravené', 'delete': 'vymazané'}[action]
                model = instance.content_type.model_class() if instance.content_type_id else None
                model_name = str(model._meta.verbose_name) if model else 'záznam'
                details = instance.get_change_message() or ''
                AuditLog.objects.create(
                    user=user, actor=(f'{name} ({user.email})' if name else user.email)[:200], actor_type='admin',
                    action=action, area='system', object_type=(model.__name__ if model else '')[:50],
                    object_id=str(instance.object_id or '')[:50],
                    summary=f'Pokročilá správa dát – {model_name} {verb}: {instance.object_repr}'[:500],
                    changes=json.dumps([{'field': 'admin', 'label': 'Detail', 'old': '', 'new': details[:400]}], ensure_ascii=False) if details else '',
                )
            except Exception:  # pragma: no cover - never break the Django admin
                pass

        post_save.connect(mirror_admin_log, sender=LogEntry, dispatch_uid='viewer_mirror_admin_log')
