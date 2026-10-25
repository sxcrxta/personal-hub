// Personal Hub 플러그인 시작점 — 로그인, '지금 가져오기' 버튼과 명령, 설정 탭을 Obsidian에 붙인다
// 웹과 똑같이 공개 키 + 내 로그인으로 접속한다. RLS를 무시하는 service_role 키는 쓰지 않는다 (architecture.md 위험 1)
import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchPendingMemos } from './fetchMemos'

declare const __SUPABASE_URL__: string
declare const __SUPABASE_KEY__: string

type PluginData = {
  deviceName: string
  /** 로그인 정보(토큰). 비밀번호는 저장하지 않는다 */
  auth: Record<string, string>
}

const DEFAULT_DATA: PluginData = { deviceName: '맥북', auth: {} }

export default class PersonalHubPlugin extends Plugin {
  data: PluginData = DEFAULT_DATA
  supabase!: SupabaseClient
  private running = false

  async onload() {
    this.data = { ...DEFAULT_DATA, ...(await this.loadData()) }

    // 로그인 토큰을 브라우저 저장소가 아니라 이 플러그인의 data.json에 둔다. Obsidian을 다시 켜도 로그인이 남는다
    this.supabase = createClient(__SUPABASE_URL__, __SUPABASE_KEY__, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => this.data.auth[key] ?? null,
          setItem: async (key, value) => {
            this.data.auth[key] = value
            await this.saveData(this.data)
          },
          removeItem: async (key) => {
            delete this.data.auth[key]
            await this.saveData(this.data)
          },
        },
      },
    })

    this.addRibbonIcon('download', 'Personal Hub: 지금 가져오기', () => this.fetchNow())
    this.addCommand({ id: 'fetch-now', name: '지금 가져오기', callback: () => this.fetchNow() })
    this.addSettingTab(new PersonalHubSettingTab(this.app, this))
  }

  /** 버튼을 빨리 두 번 눌러도 한 번만 돈다 */
  async fetchNow() {
    if (this.running) return
    const { data } = await this.supabase.auth.getSession()
    if (!data.session) {
      new Notice('Personal Hub: 먼저 설정 탭에서 로그인해 주세요.')
      return
    }
    this.running = true
    const notice = new Notice('Personal Hub: 대기 중인 메모를 가져오는 중…', 0)
    try {
      const r = await fetchPendingMemos(this.app, this.supabase, this.data.deviceName.trim() || '맥북')
      const lines: string[] = []
      if (r.created) lines.push(`노트 ${r.created}개를 만들었어요.`)
      if (r.existed) lines.push(`${r.existed}개는 이미 볼트에 있어서 상태만 완료로 바꿨어요.`)
      if (r.skipped) lines.push(`${r.skipped}개는 다른 기기가 먼저 가져갔어요.`)
      if (r.failed.length) lines.push(`실패 ${r.failed.length}개:\n${r.failed.join('\n')}`)
      notice.setMessage(`Personal Hub: ${lines.join('\n') || '가져올 메모가 없어요.'}`)
    } catch (e) {
      notice.setMessage(`Personal Hub: 가져오지 못했어요. ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      this.running = false
      setTimeout(() => notice.hide(), 8000)
    }
  }
}

class PersonalHubSettingTab extends PluginSettingTab {
  private email = ''
  private password = ''

  constructor(
    app: App,
    private plugin: PersonalHubPlugin,
  ) {
    super(app, plugin)
  }

  async display() {
    const { containerEl } = this
    containerEl.empty()
    const { data } = await this.plugin.supabase.auth.getSession()
    const user = data.session?.user

    new Setting(containerEl).setName('계정').setHeading()
    if (user) {
      new Setting(containerEl)
        .setName('로그인됨')
        .setDesc(user.email ?? '')
        .addButton((b) =>
          b.setButtonText('로그아웃').onClick(async () => {
            await this.plugin.supabase.auth.signOut()
            this.display()
          }),
        )
    } else {
      new Setting(containerEl)
        .setName('이메일')
        .setDesc('Personal Hub 웹과 같은 계정으로 로그인해요.')
        .addText((t) => t.setValue(this.email).onChange((v) => (this.email = v.trim())))
      new Setting(containerEl).setName('비밀번호').addText((t) => {
        t.inputEl.type = 'password'
        t.onChange((v) => (this.password = v))
      })
      new Setting(containerEl).addButton((b) =>
        b
          .setButtonText('로그인')
          .setCta()
          .onClick(async () => {
            const { error } = await this.plugin.supabase.auth.signInWithPassword({
              email: this.email,
              password: this.password,
            })
            this.password = ''
            if (error) {
              new Notice(`Personal Hub: 로그인하지 못했어요. ${error.message}`)
              return
            }
            new Notice('Personal Hub: 로그인했어요.')
            this.display()
          }),
      )
    }

    new Setting(containerEl).setName('이 기기').setHeading()
    new Setting(containerEl)
      .setName('기기 이름')
      .setDesc('메모를 가져갈 때 DB에 "어느 기기가 가져갔는지"로 남아요.')
      .addText((t) =>
        t.setValue(this.plugin.data.deviceName).onChange(async (v) => {
          this.plugin.data.deviceName = v
          await this.plugin.saveData(this.plugin.data)
        }),
      )
  }
}
