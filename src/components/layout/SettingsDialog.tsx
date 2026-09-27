// 설정 창 — 사이드바(폰은 상단바)의 설정 버튼으로 연다. 볼트 폴더와 파일 이름 형식 (알림·워커·테마는 7·8회차)
import { useStore } from '../../hooks/useStore.ts'
import { cleanFolder } from '../../hooks/useMemos.ts'
import { settingsStore } from '../../lib/stores.ts'
import Dialog from '../common/Dialog.tsx'
import { Field, TextInput } from '../common/Field.tsx'

type Props = {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog({ open, onClose }: Props) {
  const [settings, setSettings] = useStore(settingsStore)

  return (
    <Dialog open={open} onClose={onClose} title="설정">
      <div className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-headline-sm">Obsidian 볼트</h3>
          <Field label="메모를 저장할 볼트 안쪽 폴더">
            <TextInput
              value={settings.vaultFolder}
              placeholder="예: 0. Slip-box"
              onChange={(e) => setSettings({ ...settings, vaultFolder: e.target.value })}
              onBlur={(e) => setSettings({ ...settings, vaultFolder: cleanFolder(e.target.value) })}
            />
          </Field>
          <p className="text-body-sm text-on-surface-variant">
            웹은 볼트 안을 볼 수 없어서 폴더 이름을 직접 적어요. 컴퓨터 전체 경로(/Users/…)는 적지 않아요.
          </p>
          <Field label="파일 이름 형식">
            <TextInput
              value={settings.fileNameFormat}
              onChange={(e) => setSettings({ ...settings, fileNameFormat: e.target.value })}
            />
          </Field>
          <p className="text-body-sm text-on-surface-variant">{'{번호}'} 자리에 메모 번호가 들어가서 같은 노트가 두 번 생기지 않아요.</p>
        </section>
        <section className="rounded border bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
          알림 켜기, 맥북 프로그램 연결 상태, 테마 고르기는 곧 여기에 생겨요.
        </section>
      </div>
    </Dialog>
  )
}
