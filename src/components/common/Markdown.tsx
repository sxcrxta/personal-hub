// 마크다운 원문을 서식 그대로 보여준다 — Obsidian의 [[링크]]는 눌리지 않는 링크 모양으로
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const WIKILINK = '#wikilink'

/** 노트 맨 위 --- 사이의 속성 블록(프론트매터). 그대로 두면 마크다운이 큰 제목으로 그려 버린다 */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/

/**
 * hideFrontmatter: 볼트 노트를 보여줄 때 켠다. 날짜·태그는 화면이 따로 보여주므로 속성 블록은 숨긴다.
 * 메모 원문에는 속성 블록이 없고, 사용자가 쓴 --- 줄을 지우면 안 되어서 기본은 끈다.
 */
export default function Markdown({ source, hideFrontmatter = false }: { source: string; hideFrontmatter?: boolean }) {
  const body = hideFrontmatter ? source.replace(FRONTMATTER, '') : source
  // [[노트 제목]] → 링크 모양으로 바꿔 보여준다 (웹은 볼트를 열 수 없어서 누를 수는 없다)
  const text = body.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) => `[${name}](${WIKILINK})`)

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
