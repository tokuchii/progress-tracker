<script setup lang="ts">
import 'quill/dist/quill.snow.css'

const props = defineProps<{ modelValue: string, placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorEl = ref<HTMLDivElement>()
let quill: import('quill').default | null = null
let lastRange: { index: number, length: number } | null = null
let hydrating = false

onMounted(async () => {
  if (!editorEl.value) {
    return
  }
  const { default: Quill } = await import('quill')
  quill = new Quill(editorEl.value, {
    theme: 'snow',
    placeholder: props.placeholder ?? '',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['clean']
      ]
    }
  })
  if (props.modelValue) {
    hydrating = true
    quill.clipboard.dangerouslyPasteHTML(props.modelValue)
    hydrating = false
  }
  quill.on('text-change', () => {
    if (hydrating) {
      return
    }
    emit('update:modelValue', quill?.root.innerHTML ?? '')
  })
  quill.on('selection-change', (range) => {
    if (range) {
      lastRange = range
    }
  })
})

onUnmounted(() => {
  quill = null
})

function insertMemberQuestion(name: string) {
  if (!quill) {
    return
  }
  const length = quill.getLength()
  const index = Math.min(lastRange?.index ?? length, length)
  const prefix = index > 0 && quill.getText()[index - 1] !== '\n' ? '\n' : ''
  const label = `${name} asked question: `
  quill.insertText(index, prefix + label)
  quill.setSelection(index + prefix.length + label.length, 0, 'silent')
  quill.focus()
}

defineExpose({ insertMemberQuestion })
</script>

<template>
  <div class="notepad-editor">
    <div ref="editorEl" />
  </div>
</template>
