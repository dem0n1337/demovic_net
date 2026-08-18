<script setup lang="ts">
interface TermLine { m: string; c?: string; big?: boolean }

const config = useRuntimeConfig()
const maint = config.public.siteMode === 'maintenance'

const CRT = true

const PANIC_MSG = maint
  ? 'filesystem remounting — scheduled upgrade in progress'
  : 'unable to mount /var/www/portfolio — not deployed yet'
const PANIC_END = maint
  ? 'back shortly. backups exist, monitoring is watching.'
  : 'portfolio not found. it is, however, coming.'

const POST_LINES = [
  { pre: 'SATA Port 0 : hopes-and-dreams.img (1.0 TB)', tag: '[OK, read-only]', c: '#3fca7a' },
  { pre: 'SATA Port 1 : backups-nightly (never tested)', tag: '[OK, probably]', c: '#3fca7a' },
  { pre: 'NVMe Slot 0 : node_modules (1.2 TB)', tag: '[OK, black hole]', c: '#3fca7a' },
  { pre: 'USB Device 1: rubber-duck-debugger (senior)', tag: '[OK, listening]', c: '#3fca7a' },
  { pre: 'PS/2 Port   : cat-on-keyboard-detector', tag: '[OK, armed]', c: '#3fca7a' },
  { pre: 'SATA Port 5 : portfolio-ssd', tag: '[NOT DETECTED]', c: '#e5675f' },
]

const BOOT_ERRS = [
  'error: no such device: p0rtf0l10-c0m1ng-s00n.',
  'error: you need to load the kernel first.',
  'attempting fallback to /vmlinuz-excuses …',
  'falling back to panic()',
]

const SYSD_LINES = [
  { tag: '[  OK  ]', tc: '#3fca7a', m: ' Started Journal Service.' },
  { tag: '[  OK  ]', tc: '#3fca7a', m: ' Reached target Network is Online (it was dns).' },
  { tag: '[  OK  ]', tc: '#3fca7a', m: ' Started rubber-duck-debugger.service — listening on /dev/ears.' },
  { tag: '[  OK  ]', tc: '#3fca7a', m: ' Started excuse-generator.service (v2.6, works-on-my-machine edition).' },
  { tag: '[  OK  ]', tc: '#3fca7a', m: ' Mounted /mnt/coffee (iv-drip, hot-pluggable).' },
  { tag: '', tc: '', m: '[  203.960242] dracut-initqueue[504]: Warning: dracut-initqueue timeout - starting timeout scripts' },
  { tag: '', tc: '', m: '[  206.517922] dracut-initqueue[504]: Warning: Could not boot.' },
  { tag: '', tc: '', m: '[  207.430553] Warning: /dev/disk/by-uuid/p0rtf0l10-c0m1ng-s00n does not exist' },
  { tag: '[FAILED]', tc: '#e5675f', m: ' Failed to mount /var/www/portfolio.' },
  { tag: '[FAILED]', tc: '#e5675f', m: ' Failed to mount Mount unit for motivation, revision 404.' },
  { tag: '[DEPEND]', tc: '#e5b567', m: ' Dependency failed for Local File Systems.' },
  { tag: '[DEPEND]', tc: '#e5b567', m: ' Dependency failed for Shipping It.' },
  { tag: '', tc: '', m: '         Starting Dracut Emergency Shell…' },
  { tag: '', tc: '', m: 'Generating "/run/initramfs/rdsosreport.txt"' },
]

function welcome(): TermLine[] {
  return [
    { c: '#8fbfa0', m: 'Entering emergency mode. Exit the shell to continue… (there is nothing to continue to.)' },
    { c: '#4d7a5f', m: 'Type "journalctl -xb" to view system logs, \'notify your@email.com\' to get pinged at launch, or \'help\'.' },
    { c: '#4d7a5f', m: 'Give root password for maintenance (or press Control-D to continue):' },
  ]
}

const stage = ref<'post' | 'boot' | 'sysd' | 'glitch' | 'panic' | 'recovery'>('post')
const mem = ref(0)
const postN = ref(0)
const bootPct = ref(0)
const bootErrN = ref(0)
const sysdN = ref(0)
const countdown = ref(3)
const clock = ref('')
const pct = ref(91.0)
const term = ref<TermLine[]>(welcome())
const rebootIn = ref(45)
const tuxFlash = ref(false)

const memDisplay = computed(() => mem.value.toString().padStart(5, '0'))
const postLines = computed(() => POST_LINES.slice(0, postN.value))
const bootErrs = computed(() => BOOT_ERRS.slice(0, bootErrN.value))
const sysdLines = computed(() => SYSD_LINES.slice(0, sysdN.value))
const countdownDisplay = computed(() => countdown.value || 1)

const conRef = ref<HTMLElement | null>(null)
const termInRef = ref<HTMLInputElement | null>(null)

let timers: ReturnType<typeof setTimeout>[] = []
let intervals: ReturnType<typeof setInterval>[] = []
let clkT: ReturnType<typeof setInterval> | undefined
let progT: ReturnType<typeof setInterval> | undefined
let reducedMotion = false

function t(fn: () => void, ms: number) { timers.push(setTimeout(fn, ms)) }
function iv(fn: () => void, ms: number) { const h = setInterval(fn, ms); intervals.push(h); return h }
function clearStageTimers() {
  timers.forEach(clearTimeout); timers = []
  intervals.forEach(clearInterval); intervals = []
}

function resetIdle() { if (stage.value === 'recovery') rebootIn.value = 45 }

function runPost() {
  stage.value = 'post'; mem.value = 0; postN.value = 0
  // memory counts up like an odometer (+512 KB every 20ms ≈ 2.6s),
  // device detection starts only after it finishes
  const memT = iv(() => {
    mem.value = Math.min(65536, mem.value + 512)
    if (mem.value >= 65536) {
      clearInterval(memT)
      const postT = iv(() => {
        postN.value = Math.min(6, postN.value + 1)
        if (postN.value >= 6) clearInterval(postT)
      }, 620)
    }
  }, 20)
  t(runBoot, 7300)
}

function runBoot() {
  clearStageTimers()
  stage.value = 'boot'; bootPct.value = 0; bootErrN.value = 0
  const bootT = iv(() => {
    bootPct.value = Math.min(43, bootPct.value + 3)
    if (bootPct.value >= 43) clearInterval(bootT)
  }, 190)
  t(() => {
    const errT = iv(() => {
      bootErrN.value = Math.min(4, bootErrN.value + 1)
      if (bootErrN.value >= 4) clearInterval(errT)
    }, 700)
  }, 3000)
  t(runSysd, 6300)
}

function runSysd() {
  clearStageTimers()
  stage.value = 'sysd'; sysdN.value = 0
  const sT = iv(() => {
    sysdN.value = Math.min(SYSD_LINES.length, sysdN.value + 1)
    if (sysdN.value >= SYSD_LINES.length) clearInterval(sT)
  }, 420)
  t(() => (reducedMotion ? runPanic() : runGlitch()), 6800)
}

function runGlitch() {
  clearStageTimers()
  stage.value = 'glitch'
  t(runPanic, 2200)
}

function runPanic() {
  clearStageTimers()
  stage.value = 'panic'; countdown.value = 5
  const cdT = iv(() => {
    const c = countdown.value - 1
    if (c <= 0) { clearInterval(cdT); enterRecovery() }
    else countdown.value = c
  }, 1000)
}

function enterRecovery() {
  clearStageTimers()
  stage.value = 'recovery'; term.value = welcome(); rebootIn.value = 45
  t(() => {
    const el = termInRef.value
    if (el && matchMedia('(pointer: fine)').matches) el.focus()
  }, 80)
  const idleT = iv(() => {
    if (stage.value !== 'recovery') return
    const n = rebootIn.value - 1
    if (n <= 0) { clearInterval(idleT); rebootIn.value = 0; retryBoot() }
    else rebootIn.value = n
  }, 1000)
}

function retryBoot() {
  clearStageTimers()
  t(() => location.reload(), 700)
}

function push(lines: TermLine[]) { term.value = [...term.value, ...lines].slice(-40) }

function exec(v: string) {
  resetIdle()
  if (!v) return
  const out: TermLine[] = [{ c: '#4d7a5f', m: 'emergency@demovic.net:/# ' + v }]
  const [cmd = '', ...rest] = v.split(/\s+/)
  const arg = rest.join(' ')
  const c = cmd.toLowerCase()
  if (c === 'clear') { term.value = []; return }
  else if (c === 'help') out.push(
    { big: true, m: 'COMING SOON.' },
    { c: '#8fbfa0', m: '> a portfolio is compiling on this domain — almost there.' },
    { c: '#4d7a5f', m: 'jakub demovič · bratislava, slovakia · EN / DE / SK · everything else runs at 99.98%' },
    { c: '#8fbfa0', m: '\nnotify <email> — one email at launch, nothing else\njournalctl -xb — what actually went wrong\nstatus — rebuild progress · systemctl reboot — manual reboot (it panics again)\nclear — wipe the console' },
    { c: '#4d7a5f', m: 'psst — this shell knows more commands than it admits. sysadmins will find them.' },
  )
  else if (c === 'notify') {
    if (arg.includes('@')) {
      push(out)
      $fetch('/api/notify', { method: 'POST', body: { email: arg } })
        .then(() => push([{ c: '#3fca7a', m: '✓ ' + arg + ' queued — one email at launch. ever.' }]))
        .catch(() => push([{ c: '#e5b567', m: 'notify failed — the queue is grumpy. try again in a minute.' }]))
      return
    }
    else out.push({ c: '#e5b567', m: 'usage: notify your@email.com' })
  }
  else if (c === 'status' || c === 'uptime') out.push({ c: '#8fbfa0', m: 'rebuild ' + pct.value.toFixed(1) + '% · everything else operational · uptime 99.98%' })
  else if (c === 'journalctl') out.push({ c: '#8fbfa0', m: '-- Logs begin at boot. --\nportfolio.mount: FAILED — reason: perfectionism\nship_it.service: condition check never passed (ConditionDone=false)\nfinal_polish_loop.service: restarted 847×, still "almost there"\nrubber-duck-debugger.service: heard everything. says nothing.\n-- End of log. type \'notify <email>\' to be there when it works. --' })
  else if (c === 'systemctl') {
    const a = arg.toLowerCase()
    if (a === 'reboot') { out.push({ c: '#57d68f', m: 'rebooting…' }); push(out); retryBoot(); return }
    else if (a === 'default') out.push({ c: '#e5b567', m: "Failed to start default.target: unit not found — that's literally why you're here." })
    else if (a.startsWith('status')) {
      out.push({ c: '#e5675f', m: '● portfolio.mount — /var/www/portfolio' })
      out.push({ c: '#8fbfa0', m: '     Loaded: not-built-yet (disabled; vendor preset: procrastinate)\n     Active: failed (Result: exit-code) since boot\n    Process: 2026 ExecMount=/bin/build-it-first (code=exited, status=404)' })
    }
    else out.push({ c: '#8fbfa0', m: "systemctl: try 'systemctl reboot', 'systemctl default' or 'systemctl status portfolio.mount'" })
  }
  else if (c === 'retry' || c === 'reboot') { out.push({ c: '#57d68f', m: 'rebooting…' }); push(out); retryBoot(); return }
  else if (c === 'sudo' && arg.toLowerCase() === 'rm -rf /') {
    push(out)
    t(() => push([{ c: '#e5675f', m: 'deleting /bin … /etc … /home …' }]), 400)
    t(() => push([{ c: '#e5b567', m: 'wait.' }]), 1400)
    t(() => push([{ c: '#3fca7a', m: 'restoring from ZFS snapshot… done. this is why we take snapshots.' }]), 2200)
    return
  }
  else if (c === 'sudo') out.push({ c: '#e5b567', m: 'guest is not in the sudoers file. this incident will be reported (to jakub).' })
  else if (c === 'rm' || c === 'dd' || c === 'chmod' || c === 'mkfs') out.push({ c: '#e5b567', m: 'career-ending move detected. blocked by policy (and common sense).' })
  else if (c === 'neofetch') out.push({ c: '#57d68f', m: '    .--.       guest@demovic.net\n   |o_o |      -----------------\n   |:_/ |      OS: demovic.net v0.9 (pre-release)\n  //   \\ \\     Host: Proxmox VE cluster\n (|     | )    Kernel: 6.1-panic-prone\n/\'\\_   _/`\\   Uptime: everything except this site\n\\___)=(___/   Shell: demovic.sh · Memory: 640K (plenty)' })
  else if (c === 'htop' || c === 'top') out.push({ c: '#8fbfa0', m: '  PID USER   CPU%  MEM%  COMMAND\n    1 jakub  99.7  12.0  final_polish_loop\n  404 jakub   0.0   0.0  ship_it <defunct>\n 2026 jakub  42.0   8.1  nuxt build ./portfolio\n 1337 guest   1.3   0.4  waiting_for_launch' })
  else if (c === 'cowsay') {
    const msg = arg || 'COMING SOON.'
    out.push({ c: '#8fbfa0', m: ' ' + '_'.repeat(msg.length + 2) + '\n< ' + msg + ' >\n ' + '-'.repeat(msg.length + 2) + '\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||' })
  }
  else if (c === 'sl') out.push({ c: '#8fbfa0', m: '      ====        ________\n  _D _|  |_______/        \\__I_I_____===__\n   |(_)---  |   H\\________/ |   |     =|___|\n   /     |  |   H  |  |     |   |      ||_|\n  |      |  |   H  |__------------------|\n\nyou meant ls. the train has left anyway.' })
  else if (c === 'ls') out.push({ c: '#8fbfa0', m: '.procrastination  .perfectionism  portfolio.tar.gz.part  TODO.md' })
  else if (c === 'whoami') out.push({ c: '#8fbfa0', m: "guest (until you run 'notify')" })
  else if (c === 'vim' || c === 'vi' || c === 'nano' || c === 'emacs') out.push({ c: '#8fbfa0', m: "you are now trapped in vim.\n…luckily this isn't real vim, so you've been rescued. no :q! required." })
  else if (c === 'exit' || c === 'logout' || c === 'quit') out.push({ c: '#e5b567', m: "Failed to start default.target: unit not found — that's literally why you're here.\n(also: there is no escape. the auto-reboot gets everyone eventually.)" })
  else if (c === 'fortune') {
    const f = ["it's always DNS.", 'a backup you never tested is a hope, not a backup.', 'the S in IoT stands for security.', 'works on my machine — certified.', 'there are two kinds of people: those who back up, and those who will.', 'uptime is a lifestyle.']
    out.push({ c: '#57d68f', m: f[Math.floor(Math.random() * f.length)]! })
  }
  else if (c === 'hack' || c === 'nmap') {
    push(out)
    t(() => push([{ c: '#8fbfa0', m: 'initializing exploit framework…' }]), 300)
    t(() => push([{ c: '#8fbfa0', m: 'bypassing firewall [██████░░░░] 60%' }]), 1100)
    t(() => push([{ c: '#8fbfa0', m: 'cracking hashes… rainbow tables loaded' }]), 1900)
    t(() => push([{ c: '#e5675f', m: 'ACCESS DENIED — all ports filtered. fail2ban says hi.' }]), 2700)
    return
  }
  else if (c === 'coffee' || c === 'brew') out.push({ c: '#e5b567', m: "HTTP 418 — i'm a teapot. the coffee module ships with the site." })
  else if (c === 'date') out.push({ c: '#8fbfa0', m: new Date().toString() + '\nstill not launch day.' })
  else if (c === 'uname') out.push({ c: '#8fbfa0', m: 'demovic.net 0.9.0-rc1 #1 SMP PREEMPT_PANIC x86_64 GNU/Linux' })
  else if (c === 'man') out.push({ c: '#e5b567', m: 'no manual entry for ' + (arg || 'that') + '. task failed successfully.' })
  else if (c === 'ping') out.push({ c: '#8fbfa0', m: 'PING ' + (arg || 'the-internet') + ': fine. everything is reachable except the thing you came for.' })
  else if (c === 'tux') { push(out); tuxFlash.value = true; t(() => { tuxFlash.value = false }, 1600); return }
  else out.push({ c: '#e5b567', m: 'command not found: ' + c + " — try 'help'" })
  push(out)
}

function onEnter(e: KeyboardEvent) {
  const el = e.target as HTMLInputElement
  const v = el.value.trim()
  el.value = ''
  exec(v)
}

function termClick() {
  resetIdle()
  termInRef.value?.focus()
}

function onGlobalKey() { if (stage.value === 'recovery') resetIdle() }

watch([term, stage], async () => {
  await nextTick()
  const el = conRef.value
  if (el) el.scrollTop = el.scrollHeight
})

onMounted(() => {
  reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  clock.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  clkT = setInterval(() => { clock.value = new Date().toLocaleTimeString('en-GB', { hour12: false }) }, 1000)
  progT = setInterval(() => {
    pct.value = pct.value < 99.1 ? Math.min(99.1, pct.value + Math.random() * 0.5) : 98.4 + Math.random() * 0.7
  }, 1700)
  window.addEventListener('keydown', onGlobalKey)
  runPost()
})

onBeforeUnmount(() => {
  clearStageTimers()
  if (clkT) clearInterval(clkT)
  if (progT) clearInterval(progT)
  window.removeEventListener('keydown', onGlobalKey)
})
</script>

<template>
  <div class="page">
    <template v-if="CRT">
      <div class="crt-scan" />
      <div class="crt-vignette" />
      <div class="crt-band" />
    </template>

    <div v-if="tuxFlash" class="tux-flash">
      <img src="/tux-panic-green.png" alt="Tux" class="tux-flash-img">
    </div>

    <!-- Boot theatrics overlay (client-driven; recovery console below is server-rendered) -->
    <div v-if="stage !== 'recovery'" class="intro">
      <!-- BIOS POST -->
      <div v-if="stage === 'post'" class="bios">
        <div class="bios-head">
          <div class="bios-title">DEMOVIC BIOS (C) 2026 — v8.02</div>
          <div class="bios-sub">Energy Star · self-hosted edition</div>
        </div>
        <div class="bios-body">
          <div>CPU : 1x Human Engineer @ 8+ yrs <span class="c-green">[OK]</span></div>
          <div>Memory Test : <span class="bios-mem">{{ memDisplay }}</span> KB<span v-if="mem >= 65536" class="c-green"> OK</span></div>
          <div class="bios-detect">Detecting devices…</div>
          <div v-for="(pl, i) in postLines" :key="i" class="bios-line">&nbsp;&nbsp;{{ pl.pre }} <span :style="{ color: pl.c }">{{ pl.tag }}</span></div>
        </div>
        <div class="bios-cursor"><span class="bios-block" /></div>
      </div>

      <!-- GRUB boot loader -->
      <div v-else-if="stage === 'boot'" class="grub">
        <div class="grub-box">
          <div class="grub-title">GRUB v2.12 — booting demovic.net</div>
          <div class="grub-loading">Loading kernel /vmlinuz-portfolio-1.0 …</div>
          <div class="grub-track"><div class="grub-fill" :style="{ width: bootPct + '%' }" /></div>
          <div class="grub-meta"><span>mounting /var/www/portfolio</span><span class="grub-pct">{{ bootPct }}%</span></div>
          <div class="grub-errs">
            <div v-for="(be, i) in bootErrs" :key="i" class="grub-err">{{ be }}</div>
          </div>
        </div>
      </div>

      <!-- systemd / dracut cascade -->
      <div v-else-if="stage === 'sysd'" class="sysd">
        <div v-for="(sl, i) in sysdLines" :key="i" class="sysd-line"><span v-if="sl.tag" :style="{ color: sl.tc }">{{ sl.tag }}</span>{{ sl.m }}</div>
      </div>

      <!-- Glitch burst -->
      <div v-else-if="stage === 'glitch'" class="glitch-stage">
        <div class="glitch-noise" />
        <div class="glitch-slice glitch-slice-1" />
        <div class="glitch-slice glitch-slice-2" />
        <div class="glitch-slice glitch-slice-3" />
        <div class="glitch-center">
          <div class="glitch-tux">
            <img src="/tux-panic-green.png" alt="" aria-hidden="true" class="glitch-ghost glitch-ghost-a">
            <img src="/tux-panic-green.png" alt="" aria-hidden="true" class="glitch-ghost glitch-ghost-b">
            <img src="/tux-panic-green.png" alt="Tux panicking" class="glitch-main">
          </div>
          <div class="glitch-caption">tux.service — PANIC (core dumped)</div>
        </div>
      </div>

      <!-- Kernel panic -->
      <div v-else-if="stage === 'panic'" class="panic">
        <div class="panic-badge">*** KERNEL PANIC — NOT SYNCING ***</div>
        <div class="panic-msg">PANIC: {{ PANIC_MSG }}</div>
        <div class="panic-regs">
          <div>RIP: 0010:deploy_portfolio+0x2026/0x2026</div>
          <div>RSP: 0018:00000000bratislava0sk&nbsp;&nbsp;EFLAGS: 00010286</div>
          <div>CR2: 00000000demovic0net</div>
        </div>
        <div class="panic-trace">
          <div class="panic-trace-label">Call Trace:</div>
          <div>&nbsp;&lt;TASK&gt;</div>
          <div>&nbsp;&nbsp;build_website+0x404/0x200e</div>
          <div>&nbsp;&nbsp;design_in_browser+0x1a2/0x7f0</div>
          <div>&nbsp;&nbsp;keep_it_running+0x247/0x999</div>
          <div>&nbsp;&nbsp;final_polish_loop+0xff/0xff &nbsp;<span class="c-amber">← suspicious</span></div>
          <div>&nbsp;&nbsp;ship_it+0x0/0x1 &nbsp;<span class="c-amber">← never called</span></div>
          <div>&nbsp;&lt;/TASK&gt;</div>
        </div>
        <div class="panic-end">[ end Kernel panic — {{ PANIC_END }} ]</div>
        <div class="panic-note"># human note: nothing is broken on your end — the site is simply coming.</div>
        <div class="panic-reboot">rebooting into recovery mode in {{ countdownDisplay }}<span class="panic-block" /></div>
      </div>
    </div>

    <!-- Recovery console (always in DOM, SSR-rendered for SEO) -->
    <div class="rc-wrap" :inert="stage !== 'recovery'">
      <div class="rc">
        <div class="rc-card">
          <div class="rc-head">
            <span class="rc-title"><span class="rc-dot" />demovic.net — emergency shell (dracut)</span>
            <span class="rc-clock">{{ clock }} CET</span>
          </div>
          <div class="rc-term" @click="termClick">
            <div ref="conRef" class="rc-log" role="log" aria-live="polite">
              <div
                v-for="(tl, i) in term"
                :key="i"
                :class="['rc-line', { 'rc-line-big': tl.big }]"
                :style="tl.big ? undefined : { color: tl.c || '#8fbfa0' }"
              >{{ tl.m }}</div>
              <div class="rc-prompt">
                <span class="rc-ps1">emergency@demovic.net:/#</span>
                <input
                  ref="termInRef"
                  class="rc-input"
                  aria-label="recovery console command input"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  @keydown.enter="onEnter"
                >
              </div>
            </div>
          </div>
          <div class="rc-foot">
            <span class="rc-idle">auto-reboot in {{ rebootIn }}s<span class="rc-idle-block" /></span>
          </div>
        </div>
        <div class="rc-credit">
          <span>Jakub Demovič · Bratislava, Slovakia</span>
          <span>© 2026 · built with Nuxt 4</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.page {
  min-height: 100vh;
  background: #040608;
  color: #c7d4c9;
  position: relative;
  overflow: clip;
  cursor: default;
}
.c-green { color: #3fca7a; }
.c-amber { color: #e5b567; }

/* CRT overlay */
.crt-scan {
  position: fixed; inset: 0; pointer-events: none; z-index: 60;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .18) 0 1px, transparent 1px 3px);
  mix-blend-mode: multiply;
}
.crt-vignette {
  position: fixed; inset: 0; pointer-events: none; z-index: 60;
  background: radial-gradient(ellipse at center, transparent 52%, rgba(0, 0, 0, .5) 100%);
}
.crt-band {
  position: fixed; left: 0; right: 0; height: 80px; pointer-events: none; z-index: 60;
  background: linear-gradient(180deg, transparent, rgba(63, 202, 122, .05), transparent);
  animation: scanBand 8s linear infinite;
}

/* Tux flash (`tux` command) */
.tux-flash {
  position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center;
  pointer-events: none; background: rgba(4, 6, 8, .55);
}
.tux-flash-img { height: min(62vh, 480px); animation: tuxBreathe .5s ease-in-out infinite, tuxGlow 1s ease-in-out infinite; }

/* Intro overlay sits below the CRT layer (60), like the prototype's in-flow stages */
.intro { position: fixed; inset: 0; z-index: 50; background: #040608; overflow: auto; }

/* BIOS POST */
.bios { min-height: 100vh; padding: 48px 56px; box-sizing: border-box; font-size: 14px; line-height: 1.9; color: #b9c7bb; }
.bios-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.bios-title { font-weight: 700; color: #e8f0e9; }
.bios-sub { color: #54637a; }
.bios-body { margin-top: 26px; }
.bios-mem { color: #e8f0e9; font-weight: 700; }
.bios-detect { margin-top: 20px; color: #7d8ca0; }
.bios-line { animation: riseIn .18s ease both; white-space: pre-wrap; }
.bios-cursor { position: fixed; bottom: 40px; left: 56px; color: #54637a; font-size: 12px; }
.bios-block { display: inline-block; width: 8px; height: 13px; background: #b9c7bb; vertical-align: -2px; animation: blink 1s step-end infinite; }

/* GRUB */
.grub { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box; }
.grub-box { width: 640px; max-width: 100%; font-size: 14px; line-height: 2; }
.grub-title { color: #e8f0e9; font-weight: 700; }
.grub-loading { margin-top: 16px; color: #b9c7bb; }
.grub-track { margin-top: 10px; height: 16px; border: 1px solid #2a3a4e; border-radius: 3px; overflow: hidden; background: #0a0e13; }
.grub-fill { height: 100%; background: repeating-linear-gradient(90deg, #3fca7a 0 9px, #0a0e13 9px 12px); transition: width .3s; }
.grub-meta { display: flex; justify-content: space-between; font-size: 12px; color: #54637a; margin-top: 6px; }
.grub-pct { color: #e8f0e9; }
.grub-errs { margin-top: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.grub-err { color: #e5675f; animation: riseIn .2s ease both; }

/* systemd / dracut cascade */
.sysd { min-height: 100vh; padding: 48px 56px; box-sizing: border-box; font-size: 13.5px; line-height: 1.8; color: #b9c7bb; }
.sysd-line { white-space: pre-wrap; animation: riseIn .12s ease both; }

/* Glitch burst */
.glitch-stage { position: fixed; inset: 0; z-index: 70; background: #040608; animation: shake .12s linear infinite; }
.glitch-noise {
  position: absolute; inset: 0; opacity: .22; animation: noiseFlick .06s steps(2) infinite alternate;
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, .06) 0 1px, transparent 1px 2px),
    repeating-linear-gradient(90deg, rgba(200, 220, 255, .05) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, .03) 0 2px, transparent 2px 5px);
}
.glitch-slice { position: absolute; left: 0; right: 0; mix-blend-mode: screen; }
.glitch-slice-1 { top: 18%; height: 34px; background: rgba(94, 195, 232, .25); animation: sliceJump .14s steps(2) infinite; }
.glitch-slice-2 { top: 47%; height: 22px; background: rgba(229, 103, 95, .3); animation: sliceJump .11s steps(2) infinite reverse; }
.glitch-slice-3 { top: 71%; height: 44px; background: rgba(63, 202, 122, .22); animation: sliceJump .17s steps(2) infinite; }
.glitch-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.glitch-tux { position: relative; animation: tuxJitter .45s steps(2) infinite; }
.glitch-ghost { position: absolute; inset: 0; height: min(64vh, 520px); opacity: .45; mix-blend-mode: screen; }
.glitch-ghost-a { transform: translate(-12px, -4px); filter: sepia(1) saturate(8) hue-rotate(120deg); animation: glitchA 1.1s steps(1) infinite; }
.glitch-ghost-b { transform: translate(12px, 5px); filter: sepia(1) saturate(8) hue-rotate(310deg); animation: glitchB 1.3s steps(1) infinite; }
.glitch-main { position: relative; height: min(64vh, 520px); animation: tuxBreathe .55s ease-in-out infinite, tuxGlow 1.1s ease-in-out infinite; }
.glitch-caption { font-size: 15px; font-weight: 700; color: #e5675f; letter-spacing: .06em; animation: blink .35s step-end infinite; }

/* Kernel panic */
.panic { min-height: 100vh; padding: 48px 56px; box-sizing: border-box; font-size: 13.5px; line-height: 1.85; color: #d8c9c7; }
.panic-badge {
  display: inline-block; background: #e5675f; color: #040608; font-weight: 700; padding: 6px 14px;
  font-size: 14px; letter-spacing: .08em; animation: riseIn .2s ease both;
}
.panic-msg { margin-top: 24px; color: #e5b567; font-weight: 700; font-size: 15px; animation: riseIn .25s ease .1s both; }
.panic-regs { margin-top: 20px; color: #a99b99; animation: riseIn .25s ease .2s both; }
.panic-trace { margin-top: 18px; animation: riseIn .25s ease .3s both; }
.panic-trace-label { color: #7d8ca0; }
.panic-end { margin-top: 22px; color: #e8f0e9; animation: riseIn .25s ease .4s both; }
.panic-note { margin-top: 14px; color: #57d68f; animation: riseIn .25s ease .45s both; }
.panic-reboot { margin-top: 34px; font-size: 15px; color: #3fca7a; font-weight: 700; animation: riseIn .25s ease .5s both; }
.panic-block { display: inline-block; width: 9px; height: 15px; background: #3fca7a; margin-left: 8px; vertical-align: -2px; animation: blink .5s step-end infinite; }

/* Recovery console */
.rc-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px 36px; box-sizing: border-box; }
.rc { width: 760px; max-width: 100%; }
.rc-card {
  animation: riseIn .4s ease both; border: 1px solid #1c4a33; border-radius: 10px; overflow: hidden;
  background: rgba(6, 12, 9, .92); box-shadow: 0 0 60px rgba(63, 202, 122, .09), 0 30px 80px rgba(0, 0, 0, .6);
}
.rc-head { display: flex; justify-content: space-between; align-items: center; padding: 13px 20px; border-bottom: 1px solid #1c4a33; font-size: 12px; }
.rc-title { color: #57d68f; display: flex; align-items: center; gap: 9px; }
.rc-dot { width: 7px; height: 7px; border-radius: 50%; background: #3fca7a; box-shadow: 0 0 8px #3fca7a; animation: pulse 2s infinite; }
.rc-clock { color: #2f8f5c; }
.rc-term { padding: 20px 24px; font-size: 13px; line-height: 1.9; cursor: text; }
.rc-log { display: flex; flex-direction: column; gap: 5px; height: 300px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #1c4a33 transparent; }
.rc-log::-webkit-scrollbar { width: 8px; }
.rc-log::-webkit-scrollbar-track { background: transparent; }
.rc-log::-webkit-scrollbar-thumb { background: #1c4a33; border-radius: 99px; }
.rc-line { white-space: pre-wrap; animation: riseIn .25s ease both; }
.rc-line-big {
  font-size: 28px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; color: #e8f0e9;
  text-shadow: 0 0 22px rgba(63, 202, 122, .45);
}
.rc-prompt { display: flex; gap: 9px; align-items: center; }
.rc-ps1 { color: #3fca7a; white-space: nowrap; }
.rc-input {
  flex: 1; background: transparent; border: none; outline: none; color: #e8f0e9;
  font-family: 'JetBrains Mono', monospace; font-size: 13px; caret-color: #3fca7a;
}
.rc-foot { display: flex; justify-content: flex-end; align-items: center; padding: 12px 20px; border-top: 1px solid #1c4a33; font-size: 11.5px; }
.rc-idle { color: #e5b567; }
.rc-idle-block { display: inline-block; width: 7px; height: 12px; background: #e5b567; margin-left: 7px; vertical-align: -2px; animation: blink 1s step-end infinite; }
.rc-credit { animation: riseIn .4s ease .15s both; display: flex; justify-content: space-between; margin-top: 14px; font-size: 11.5px; color: #3a5a47; flex-wrap: wrap; gap: 8px; }
</style>
