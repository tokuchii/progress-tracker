<script setup lang="ts">
import 'quill/dist/quill.snow.css'

const props = defineProps<{ modelValue: string, placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorEl = ref<HTMLDivElement>()
let quill: import('quill').default | null = null

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
    quill.clipboard.dangerouslyPasteHTML(props.modelValue)
  }
  quill.on('text-change', () => {
    emit('update:modelValue', quill?.root.innerHTML ?? '')
  })
})

onUnmounted(() => {
  quill = null
})
</script>

<template>
  <div class="notepad-editor">
    <div ref="editorEl" />
  </div>
</template>
