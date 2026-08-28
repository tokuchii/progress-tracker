const STRIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE',
  'FORM', 'INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'IMG', 'SVG', 'MATH',
  'VIDEO', 'AUDIO', 'TEMPLATE'
])

export function sanitizeNotepadHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }
    const el = node as HTMLElement
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    }
    if (STRIP_TAGS.has(el.tagName)) {
      el.remove()
      return
    }
    if (el.tagName === 'A' && el.getAttribute('href')?.trim().toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href')
    }
    for (const child of Array.from(el.children)) {
      walk(child)
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}

export interface NotepadRun {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  background?: string
  color?: string
}

type NotepadListType = 'ordered' | 'bullet' | 'checked' | 'unchecked'

interface NotepadBlock {
  el: HTMLElement
  depth: number
  list?: NotepadListType
}

interface NotepadStyle {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  background?: string
  color?: string
}

function ownCssColor(el: HTMLElement, property: 'backgroundColor' | 'color'): string | undefined {
  const value = el.style[property]
  if (!value || value === 'transparent' || value === 'inherit' || value === 'initial' || value === 'rgba(0, 0, 0, 0)') {
    return undefined
  }
  return value
}

export function collectNotepadRuns(root: Node): NotepadRun[] {
  const runs: NotepadRun[] = []
  const walk = (node: Node, style: NotepadStyle) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        runs.push({ text, ...style })
      }
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }
    const el = node as HTMLElement
    if (el.tagName === 'BR') {
      runs.push({ text: '\n', ...style })
      return
    }
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      return
    }
    for (const child of Array.from(el.childNodes)) {
      walk(child, {
        bold: style.bold || el.tagName === 'STRONG' || el.tagName === 'B',
        italic: style.italic || el.tagName === 'EM' || el.tagName === 'I',
        underline: style.underline || el.tagName === 'U',
        strike: style.strike || el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL',
        background: ownCssColor(el, 'backgroundColor') || style.background,
        color: ownCssColor(el, 'color') || style.color
      })
    }
  }
  walk(root, { bold: false, italic: false, underline: false, strike: false })
  return runs
}

export function flattenNotepadBlocks(container: HTMLElement): NotepadBlock[] {
  const blocks: NotepadBlock[] = []
  const indentOf = (el: Element) => Number(/(?:^|\s)ql-indent-(\d+)(?:\s|$)/.exec(el.getAttribute('class') ?? '')?.[1] ?? 0)
  const fallbackType = (list: Element): NotepadListType => list.tagName === 'OL' ? 'ordered' : 'bullet'
  const pushList = (list: Element, nestingDepth: number) => {
    for (const li of Array.from(list.children)) {
      if (li.tagName !== 'LI') {
        continue
      }
      const depth = Math.max(indentOf(li), nestingDepth)
      blocks.push({
        el: li as HTMLElement,
        depth,
        list: (li.getAttribute('data-list') as NotepadListType | null) ?? fallbackType(list)
      })
      for (const child of Array.from(li.children)) {
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          pushList(child, depth + 1)
        }
      }
    }
  }
  for (const child of Array.from(container.children)) {
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      pushList(child, 0)
    } else {
      blocks.push({ el: child as HTMLElement, depth: indentOf(child) })
    }
  }
  return blocks
}

function toAlpha(value: number) {
  let letters = ''
  let remaining = value
  while (remaining > 0) {
    remaining -= 1
    letters = String.fromCharCode(97 + (remaining % 26)) + letters
    remaining = Math.floor(remaining / 26)
  }
  return letters
}

function toRoman(value: number) {
  const numerals: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'],
    [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ]
  let result = ''
  let remaining = value
  for (const [numeral, symbol] of numerals) {
    while (remaining >= numeral) {
      result += symbol
      remaining -= numeral
    }
  }
  return result
}

function parseCssColor(value?: string): [number, number, number] | null {
  if (!value) {
    return null
  }
  const raw = value.trim().toLowerCase()
  if (!raw || raw === 'transparent' || raw === 'inherit' || raw === 'initial' || raw === 'rgba(0, 0, 0, 0)' || raw === 'rgba(0,0,0,0)') {
    return null
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3) {
      h = h[0]! + h[0] + h[1] + h[1] + h[2] + h[2]
    }
    return [Number.parseInt(h.slice(0, 2), 16), Number.parseInt(h.slice(2, 4), 16), Number.parseInt(h.slice(4, 6), 16)]
  }
  const channels = raw.match(/rgba?\(([^)]+)\)/)?.[1]?.split(/[\s,/]+/).map(Number).filter(n => Number.isFinite(n)) ?? []
  if (channels.length >= 3) {
    return [channels[0]!, channels[1]!, channels[2]!]
  }
  return null
}

function orderedLabel(index: number, depth: number) {
  const style = depth % 3
  if (style === 1) {
    return `${toAlpha(index)}. `
  }
  if (style === 2) {
    return `${toRoman(index)}. `
  }
  return `${index}. `
}

export async function exportQuestionsPdf(html: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const fontSize = 11
  const pt = 1 / doc.internal.scaleFactor
  const em = fontSize * pt
  const lineHeight = em * 1.35
  const indentPerLevel = 12
  const checkboxSize = em * 0.95
  const checkboxGap = em * 0.35

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Odoo Bootcamp Tracker — Questions', margin, 18)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'normal')

  const container = document.createElement('div')
  container.innerHTML = sanitizeNotepadHtml(html || '')
  const blocks = flattenNotepadBlocks(container)

  const fontKey = (run: NotepadRun) => run.bold && run.italic ? 'bolditalic' : run.bold ? 'bold' : run.italic ? 'italic' : 'normal'
  const measure = (run: NotepadRun, text: string) => {
    doc.setFont('helvetica', fontKey(run))
    return doc.getTextWidth(text)
  }

  let y = 28
  let drewAny = false
  const counters = new Map<Element, number>()

  for (const block of blocks) {
    const runs = collectNotepadRuns(block.el)
    if (!block.list && !runs.length) {
      continue
    }
    drewAny = true

    let prefix = ''
    let checkbox = false
    if (block.list === 'ordered') {
      const group = block.el.parentElement ?? block.el
      const index = (counters.get(group) ?? 0) + 1
      counters.set(group, index)
      prefix = orderedLabel(index, block.depth)
    } else if (block.list === 'bullet') {
      prefix = '\u2022 '
    } else if (block.list) {
      checkbox = true
    }

    const blockIndent = block.depth * indentPerLevel
    doc.setFont('helvetica', 'normal')
    const prefixWidth = checkbox ? checkboxSize + checkboxGap : doc.getTextWidth(prefix)
    const textStartX = margin + blockIndent + prefixWidth
    const lineBudget = pageWidth - margin - textStartX

    type Token = { text: string, run: NotepadRun }
    const tokens: Token[] = []
    for (const run of runs) {
      const parts = run.text.split('\n')
      for (let index = 0; index < parts.length; index++) {
        if (index > 0) {
          tokens.push({ text: '\n', run })
        }
        for (const word of parts[index]!.match(/\s*\S+\s*/g) ?? []) {
          tokens.push({ text: word, run })
        }
      }
    }

    const lines: Token[][] = [[]]
    let lineWidth = 0
    let lastWasBreak = false
    for (const token of tokens) {
      if (token.text === '\n') {
        if (lines[lines.length - 1]!.length > 0 || lastWasBreak) {
          lines.push([])
        }
        lastWasBreak = true
        lineWidth = 0
        continue
      }
      lastWasBreak = false
      const width = measure(token.run, token.text)
      if (lineWidth + width > lineBudget && lines[lines.length - 1]!.length > 0) {
        lines.push([])
        lineWidth = 0
      }
      lines[lines.length - 1]!.push(token)
      lineWidth += width
    }
    if (lastWasBreak && lines.length > 1) {
      lines.pop()
    }

    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin + 4
      }
      if (line === lines[0] && prefix) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        doc.text(prefix, margin + blockIndent, y)
      }
      if (line === lines[0] && checkbox) {
        doc.setDrawColor(60, 60, 60)
        doc.setFillColor(60, 60, 60)
        doc.rect(margin + blockIndent, y - em * 0.72, checkboxSize, checkboxSize, block.list === 'checked' ? 'FD' : 'S')
      }
      let x = textStartX
      for (const token of line) {
        const width = measure(token.run, token.text)
        const bg = parseCssColor(token.run.background)
        if (bg && token.text.trim()) {
          const xPad = em * 0.05
          const yPad = em * 0.1
          const ascent = em * 0.72
          const descent = em * 0.22
          doc.setFillColor(bg[0], bg[1], bg[2])
          doc.rect(x - xPad, y - ascent - yPad, width + xPad * 2, ascent + descent + yPad * 2, 'F')
        }
        const fg = parseCssColor(token.run.color) ?? [30, 30, 30]
        doc.setTextColor(fg[0], fg[1], fg[2])
        doc.setFont('helvetica', fontKey(token.run))
        doc.text(token.text, x, y)
        if (token.run.underline || token.run.strike) {
          doc.setDrawColor(fg[0], fg[1], fg[2])
          if (token.run.underline) {
            doc.line(x, y + em * 0.18, x + width, y + em * 0.18)
          }
          if (token.run.strike) {
            doc.line(x, y - em * 0.28, x + width, y - em * 0.28)
          }
        }
        x += width
      }
      y += lineHeight
    }
    y += 2
  }

  if (!drewAny) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text('No questions yet.', margin, 28)
  }

  doc.save('bootcamp-questions.pdf')
}
