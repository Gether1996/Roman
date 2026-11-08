// Renders simple admin-edited text safely (no v-html):
//   "## Heading"  -> heading
//   "- item"      -> bullet list
//   blank line    -> new paragraph
const { defineComponent, computed } = Vue;

export function parseRichText(text) {
  const blocks = [];
  let list = null;
  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'ul', items: list });
    list = null;
  };
  String(text || '').replace(/\r\n/g, '\n').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); return; }
    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph(); flushList();
      blocks.push({ type: 'h', text: line.replace(/^#+\s*/, '') });
      return;
    }
    if (/^[-•*]\s+/.test(line)) {
      flushParagraph();
      list = list || [];
      list.push(line.replace(/^[-•*]\s+/, ''));
      return;
    }
    flushList();
    paragraph.push(line);
  });
  flushParagraph();
  flushList();
  return blocks;
}

export const RichText = defineComponent({
  name: 'RichText',
  props: { text: String, headingTag: { type: String, default: 'h2' } },
  setup(props) {
    const blocks = computed(() => parseRichText(props.text));
    return { blocks };
  },
  template: `
    <div class="rich-text">
      <template v-for="(block, i) in blocks" :key="i">
        <component v-if="block.type === 'h'" :is="headingTag">{{ block.text }}</component>
        <ul v-else-if="block.type === 'ul'"><li v-for="(item, j) in block.items" :key="j">{{ item }}</li></ul>
        <p v-else>{{ block.text }}</p>
      </template>
    </div>
  `,
});
