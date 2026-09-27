// 마크다운 원문을 서식 그대로 보여준다 — Obsidian의 [[링크]]는 눌리지 않는 링크 모양으로
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const WIKILINK = '#wikilink'

export default function Markdown({ source }: { source: string }) {
  // [[노트 제목]] → 링크 모양으로 바꿔 보여준다 (웹은 볼트를 열 수 없어서 누를 수는 없다)
  const text = source.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) => `[${name}](${WIKILINK})`)

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href === WIKILINK ? (
              <span className="wikilink">{children}</span>
            ) : (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
