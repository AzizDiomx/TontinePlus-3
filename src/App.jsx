import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import './index.css'
import * as S from './assets/screenshots.js'

gsap.registerPlugin(ScrollTrigger, TextPlugin)


// ── CURSOR ──────────────────────────────────────────────────────────
function Cursor() {
  const ring = useRef(null), dot = useRef(null), txt = useRef(null)
  useEffect(() => {
    const r = ring.current, d = dot.current, t = txt.current
    let mx = 0, my = 0
    gsap.set([r,d], { xPercent:-50, yPercent:-50 })
    const move = e => {
      mx = e.clientX; my = e.clientY
      gsap.to(d, { x:mx, y:my, duration:0.05, ease:'none' })
      gsap.to(r, { x:mx, y:my, duration:0.28, ease:'power2.out' })
    }
    const onEnter = e => {
      const label = e.currentTarget.dataset.cursor || ''
      gsap.to(r, { scale:2.2, borderColor:'rgba(200,160,32,0.9)', duration:0.35, ease:'power3.out' })
      gsap.to(d, { scale:0, duration:0.2 })
      if (label && t) { t.textContent = label; gsap.to(t, { opacity:1, duration:0.2 }) }
    }
    const onLeave = () => {
      gsap.to(r, { scale:1, borderColor:'rgba(200,160,32,0.45)', duration:0.35, ease:'power3.out' })
      gsap.to(d, { scale:1, duration:0.2 })
      if (t) gsap.to(t, { opacity:0, duration:0.15 })
    }
    window.addEventListener('mousemove', move)
    document.querySelectorAll('a,button,[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <>
      <div ref={ring} style={{ position:'fixed',top:0,left:0,zIndex:9999,pointerEvents:'none',width:36,height:36,borderRadius:'50%',border:'1.5px solid rgba(200,160,32,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <span ref={txt} style={{ opacity:0, fontFamily:'var(--mono)',fontSize:8,color:'var(--gold)',letterSpacing:1,textTransform:'uppercase',whiteSpace:'nowrap' }}/>
      </div>
      <div ref={dot} style={{ position:'fixed',top:0,left:0,zIndex:9999,pointerEvents:'none',width:6,height:6,borderRadius:'50%',background:'var(--gold-hi)' }}/>
    </>
  )
}

// ── DATA STREAM ──────────────────────────────────────────────────────
function DataStream() {
  const CHARS = '01アイウカキ+-×=∑∫∂∇'
  return (
    <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
      {Array.from({length:12},(_,i) => (
        <div key={i} style={{ position:'absolute',left:`${(i/12)*100}%`,top:0,display:'flex',flexDirection:'column',gap:20,animation:`stream-down ${6+(i%4)*2.5}s linear ${(i%5)*-1.8}s infinite`,opacity:0.04+(i%3)*0.012,willChange:'transform' }}>
          {Array.from({length:20},(_,j) => (
            <span key={j} style={{ fontFamily:'var(--mono)',fontSize:11,color:j%4===0?'var(--acid)':'var(--gold)',lineHeight:1.2 }}>
              {CHARS[(i*3+j*7)%CHARS.length]}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── HUD CORNERS ──────────────────────────────────────────────────────
function HudCorners({ size=20, color='var(--gold)', opacity=0.5 }) {
  const s = { position:'absolute', pointerEvents:'none' }
  const l = { stroke:color, strokeWidth:1.5, fill:'none', opacity }
  return (
    <>
      <svg style={{...s,top:0,left:0}} width={size} height={size}><polyline points={`${size},0 0,0 0,${size}`} style={l}/></svg>
      <svg style={{...s,top:0,right:0}} width={size} height={size}><polyline points={`0,0 ${size},0 ${size},${size}`} style={l}/></svg>
      <svg style={{...s,bottom:0,left:0}} width={size} height={size}><polyline points={`0,0 0,${size} ${size},${size}`} style={l}/></svg>
      <svg style={{...s,bottom:0,right:0}} width={size} height={size}><polyline points={`${size},0 ${size},${size} 0,${size}`} style={l}/></svg>
    </>
  )
}

// ── PHONE ────────────────────────────────────────────────────────────
function Phone({ src, style={}, glowColor='rgba(200,160,32,0.15)' }) {
  return (
    <div style={{ position:'relative', ...style }}>
      <div style={{ position:'absolute',inset:-20,borderRadius:60,background:`radial-gradient(ellipse, ${glowColor}, transparent 65%)`,filter:'blur(10px)',pointerEvents:'none',zIndex:-1 }}/>
      <div style={{ width:220,borderRadius:44,background:'linear-gradient(170deg,#111410,#050806)',border:'1px solid rgba(200,160,32,0.2)',overflow:'hidden',boxShadow:`0 0 0 0.5px rgba(200,160,32,0.1), 0 60px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(200,160,32,0.08)`,position:'relative' }}>
        <div style={{ position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',width:90,height:26,background:'#050806',borderRadius:16,zIndex:2,border:'1px solid rgba(200,160,32,0.08)' }}/>
        <img src={src} alt="" style={{ width:'100%',display:'block',borderRadius:43 }}/>
      </div>
      <div style={{ position:'absolute',bottom:-24,left:'15%',right:'15%',height:24,background:'radial-gradient(ellipse, rgba(200,160,32,0.12), transparent)',filter:'blur(8px)' }}/>
    </div>
  )
}

// ── TYPEWRITER ───────────────────────────────────────────────────────
function TypewriterTitle() {
  const l1=useRef(null), l2=useRef(null), l3=useRef(null)
  const c1=useRef(null), c2=useRef(null), c3=useRef(null)
  useEffect(() => {
    const tl = gsap.timeline({ delay:0.4 })
    tl.fromTo(l1.current, {text:''}, {text:"La tontine,", duration:0.9, ease:'none'})
      .to(c1.current, {opacity:0,duration:0.1}, '>')
      .fromTo(l2.current, {text:''}, {text:"reinventee", duration:0.8, ease:'none'}, '+=0.1')
      .to(c2.current, {opacity:0,duration:0.1}, '>')
      .fromTo(l3.current, {text:''}, {text:"pour l'Afrique", duration:1, ease:'none'}, '+=0.05')
      .to(c3.current, {opacity:0, repeat:6, yoyo:true, duration:0.4})
    return () => tl.kill()
  }, [])
  const cs = { display:'inline-block',width:3,height:'0.85em',background:'var(--gold-hi)',marginLeft:4,verticalAlign:'middle' }
  return (
    <h1 style={{ fontFamily:'var(--serif)',fontSize:'clamp(48px,5.8vw,82px)',fontWeight:700,lineHeight:0.95,letterSpacing:-2.5,marginBottom:28 }}>
      <span style={{display:'block'}}><span ref={l1}/><span ref={c1} style={cs}/></span>
      <span style={{display:'block',fontStyle:'italic',color:'var(--gold)'}}><span ref={l2}/><span ref={c2} style={cs}/></span>
      <span style={{display:'block'}}><span ref={l3}/><span ref={c3} style={cs}/></span>
    </h1>
  )
}

// ── COUNTER ──────────────────────────────────────────────────────────
function Counter({ to, suffix, label }) {
  const numRef=useRef(null), wrapRef=useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger:wrapRef.current, start:'top 85%', once:true,
        onEnter: () => {
          const obj={val:0}
          gsap.to(obj, { val:to, duration:2, ease:'power2.out',
            onUpdate: () => { if(numRef.current) numRef.current.textContent=Math.round(obj.val)+suffix }
          })
        }
      })
    })
    return () => ctx.revert()
  }, [to,suffix])
  return (
    <div ref={wrapRef}>
      <div style={{ fontFamily:'var(--mono)',fontSize:40,fontWeight:500,color:'var(--gold-hi)',lineHeight:1,textShadow:'0 0 20px rgba(200,160,32,0.5)' }}>
        <span ref={numRef}>0{suffix}</span>
      </div>
      <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--muted)',letterSpacing:2.5,textTransform:'uppercase',marginTop:8 }}>{label}</div>
    </div>
  )
}

// ── NAV ──────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
  const ref=useRef(null)
  useLayoutEffect(() => {
    gsap.fromTo(ref.current, {y:-60,opacity:0}, {y:0,opacity:1,duration:1,ease:'power3.out',delay:0.2})
  }, [])
  return (
    <nav ref={ref} style={{ position:'fixed',top:0,left:0,right:0,zIndex:800,padding:'18px 0',background:scrolled?'rgba(3,8,6,0.95)':'transparent',backdropFilter:scrolled?'blur(32px)':'none',borderBottom:scrolled?'1px solid rgba(200,160,32,0.12)':'none',transition:'all 0.5s',opacity:0 }}>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <a href="#" style={{ display:'flex',alignItems:'center',gap:10 }}>
          <img src={S.icon} alt="" style={{ width:28,height:28,borderRadius:8,filter:'drop-shadow(0 0 6px rgba(200,160,32,0.4))' }}/>
          <span style={{ fontFamily:'var(--serif)',fontSize:22,fontWeight:600,letterSpacing:-0.5 }}>Tontine<span style={{color:'var(--gold)'}}>Plus</span></span>
        </a>
        <div style={{ display:'flex',gap:40,alignItems:'center' }}>
          {[['#features','01 Fonctions'],['#screens','02 Apercu'],['#process','03 Processus'],['#security','04 Securite']].map(([h,l]) => (
            <a key={h} href={h} style={{ fontFamily:'var(--mono)',fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',transition:'color 0.3s' }}
              onMouseEnter={e=>{e.target.style.color='var(--gold)'; e.target.style.textShadow='0 0 12px rgba(200,160,32,0.6)'}}
              onMouseLeave={e=>{e.target.style.color='var(--muted)'; e.target.style.textShadow='none'}}
            >{l}</a>
          ))}
        </div>
        <a href="#download" data-cursor="DOWNLOAD" style={{ display:'inline-flex',alignItems:'center',gap:9,background:'transparent',color:'var(--gold)',padding:'10px 22px',borderRadius:2,fontFamily:'var(--mono)',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',border:'1px solid rgba(200,160,32,0.45)',transition:'all 0.3s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,160,32,0.08)'; e.currentTarget.style.borderColor='rgba(200,160,32,0.8)'; e.currentTarget.style.boxShadow='0 0 20px rgba(200,160,32,0.2)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(200,160,32,0.45)'; e.currentTarget.style.boxShadow='none'}}
        >
          <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--acid)',boxShadow:'0 0 8px var(--acid)',animation:'flicker 4s infinite' }}/>
          Telecharger
        </a>
      </div>
    </nav>
  )
}

// ── TICKER ───────────────────────────────────────────────────────────
const WORDS = ['Cotisations precisees','Rotation automatique','Zero connexion','Export JSON','Biometrie','Multi-groupes','FCFA natif','Gratuit']
function Ticker() {
  const track=useRef(null)
  useEffect(() => {
    const el=track.current; if(!el) return
    const w=el.scrollWidth/3
    gsap.to(el, { x:-w, duration:24, ease:'none', repeat:-1, modifiers:{x:gsap.utils.unitize(x=>parseFloat(x)%w)} })
  },[])
  return (
    <div style={{ background:'var(--gold)',padding:'12px 0',overflow:'hidden' }}>
      <div ref={track} style={{ display:'inline-flex',gap:0,whiteSpace:'nowrap',willChange:'transform' }}>
        {[...Array(3)].map((_,gi)=>WORDS.map(w=>(
          <span key={`${gi}${w}`} style={{ display:'inline-flex',alignItems:'center',color:'var(--void)',fontFamily:'var(--mono)',fontSize:10,fontWeight:500,letterSpacing:3,textTransform:'uppercase' }}>
            {w}<svg style={{margin:'0 28px'}} width="20" height="2"><rect width="20" height="1" y="0.5" fill="rgba(3,8,6,0.25)"/></svg>
          </span>
        )))}
      </div>
    </div>
  )
}

// ── FEATURE CARD ─────────────────────────────────────────────────────
const FEATURES = [
  {id:'01',title:'Cotisations precisees',desc:'Paiements complets ou partiels avec historique complet et recus numerotes automatiquement.'},
  {id:'02',title:'Rotation intelligente',desc:'Manuel, automatique ou tirage au sort. Le calendrier des beneficiaires se calcule seul.'},
  {id:'03',title:'Multi-groupes',desc:'Plusieurs tontines simultanees avec devises, frequences et regles distinctes.'},
  {id:'04',title:'Rapports detailles',desc:'Statistiques par periode, taux de collecte, export JSON et CSV.'},
  {id:'05',title:'Hors ligne total',desc:"Aucune connexion requise. Vos donnees ne quittent jamais l'appareil."},
  {id:'06',title:'Sauvegarde portable',desc:"Exportez via WhatsApp ou email. Restaurez en un tap."},
]
function FeatureCard({id,title,desc}) {
  const ref=useRef(null), lineRef=useRef(null), glowRef=useRef(null), tl=useRef(null)
  useEffect(()=>{
    tl.current=gsap.timeline({paused:true})
      .to(lineRef.current, {scaleX:1,duration:0.5,ease:'power3.out'},0)
      .to(glowRef.current, {opacity:1,duration:0.4},0)
      .to(ref.current, {borderColor:'rgba(200,160,32,0.35)',y:-6,duration:0.4,ease:'power2.out'},0)
    return ()=>tl.current.kill()
  },[])
  return (
    <div ref={ref} data-cursor="VOIR" onMouseEnter={()=>tl.current.play()} onMouseLeave={()=>tl.current.reverse()}
      style={{ position:'relative',padding:'36px 32px',borderRadius:2,background:'rgba(13,61,36,0.15)',border:'1px solid rgba(200,160,32,0.12)',overflow:'hidden' }}>
      <div ref={lineRef} style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,var(--gold-hi),transparent)',transformOrigin:'left',transform:'scaleX(0)' }}/>
      <div ref={glowRef} style={{ position:'absolute',inset:0,opacity:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 0%,rgba(200,160,32,0.05),transparent 60%)' }}/>
      <HudCorners size={12} color="var(--gold)" opacity={0.3}/>
      <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,marginBottom:24,textTransform:'uppercase' }}>SYS.{id}</div>
      <div style={{ fontFamily:'var(--serif)',fontSize:22,fontWeight:600,marginBottom:12,letterSpacing:-0.4,lineHeight:1.15 }}>{title}</div>
      <div style={{ fontSize:13,color:'var(--muted)',lineHeight:1.9,fontWeight:300 }}>{desc}</div>
    </div>
  )
}

// ── SCREENS ──────────────────────────────────────────────────────────
const SCREENS=[
  {key:'onboarding1',label:'Onboarding',src:S.onboarding1},
  {key:'login',label:'Connexion PIN',src:S.login},
  {key:'register',label:'Inscription',src:S.register},
  {key:'dashboard_dark',label:'Tableau de bord',src:S.dashboard_dark},
  {key:'dashboard_light',label:'Mode clair',src:S.dashboard_light},
  {key:'groups',label:'Mes tontines',src:S.groups},
  {key:'calendar',label:'Agenda',src:S.calendar},
  {key:'reports',label:'Rapports',src:S.reports},
  {key:'settings',label:'Parametres',src:S.settings},
  {key:'profile',label:'Mon profil',src:S.profile},
]
function ScreensSection() {
  const [active,setActive]=useState(0)
  const imgRef=useRef(null), numRef=useRef(null), labelRef=useRef(null)
  const secRef=useRef(null), intRef=useRef(null)

  const transition=next=>{
    const tl=gsap.timeline()
    tl.to(imgRef.current,   {opacity:0,scale:0.92,rotationY:8,duration:0.35,ease:'power2.in'})
      .to(numRef.current,   {opacity:0,y:-10,duration:0.2,ease:'power2.in'},0)
      .to(labelRef.current, {opacity:0,x:-20,duration:0.2},0)
      .call(()=>setActive(next))
      .fromTo(imgRef.current,{opacity:0,scale:1.04,rotationY:-8},{opacity:1,scale:1,rotationY:0,duration:0.5,ease:'power3.out'})
      .fromTo(numRef.current,{opacity:0,y:15},{opacity:1,y:0,duration:0.4,ease:'power2.out'},'<0.1')
      .fromTo(labelRef.current,{opacity:0,x:20},{opacity:1,x:0,duration:0.4,ease:'power2.out'},'<')
  }
  const go=i=>{ clearInterval(intRef.current); transition(i); intRef.current=setInterval(()=>{ setActive(p=>{const n=(p+1)%SCREENS.length; transition(n); return p}) },3800) }
  useEffect(()=>{
    intRef.current=setInterval(()=>{ setActive(p=>{const n=(p+1)%SCREENS.length; transition(n); return p}) },3800)
    const ctx=gsap.context(()=>{
      gsap.fromTo('.screens-head',{opacity:0,y:40},{opacity:1,y:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:secRef.current,start:'top 75%'}})
    },secRef)
    return ()=>{ clearInterval(intRef.current); ctx.revert() }
  },[])

  return (
    <section id="screens" ref={secRef} style={{ padding:'140px 0',background:'var(--deep)',position:'relative',overflow:'hidden' }}>
      <DataStream/>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px',position:'relative',zIndex:1 }}>
        <div className="screens-head" style={{ marginBottom:80,opacity:0 }}>
          <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,textTransform:'uppercase',marginBottom:16 }}>&gt; INTERFACE.PREVIEW</div>
          <h2 style={{ fontFamily:'var(--serif)',fontSize:'clamp(32px,4vw,54px)',fontWeight:700,lineHeight:1,letterSpacing:-1.5 }}>Chaque ecran,<br/>pense avec soin</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:80,alignItems:'center' }}>
          <div>
            <div ref={numRef} style={{ fontFamily:'var(--mono)',fontSize:120,fontWeight:300,color:'rgba(200,160,32,0.07)',lineHeight:1,letterSpacing:-6,marginBottom:-20,userSelect:'none' }}>
              {String(active+1).padStart(2,'0')}
            </div>
            <div ref={labelRef} style={{ fontFamily:'var(--serif)',fontSize:38,fontWeight:600,letterSpacing:-1,color:'var(--text)',marginBottom:32 }}>
              {SCREENS[active].label}
            </div>
            <div style={{ display:'flex',gap:6,marginBottom:48 }}>
              {SCREENS.map((_,i)=>(
                <div key={i} onClick={()=>go(i)} data-cursor="SELECT" style={{ height:2,flex:i===active?4:1,background:i===active?'var(--gold)':'rgba(200,160,32,0.15)',borderRadius:2,transition:'flex 0.6s cubic-bezier(0.16,1,0.3,1)',boxShadow:i===active?'0 0 8px rgba(200,160,32,0.5)':'none' }}/>
              ))}
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:10 }}>
              {SCREENS.map((sc,i)=>(
                <div key={i} onClick={()=>go(i)} data-cursor="SELECT" style={{ position:'relative' }}>
                  <img src={sc.src} alt={sc.label} style={{ width:48,borderRadius:10,display:'block',opacity:i===active?1:0.2,outline:i===active?'1px solid rgba(200,160,32,0.7)':'none',outlineOffset:3,transform:i===active?'scale(1.1)':'scale(1)',transition:'all 0.4s cubic-bezier(0.16,1,0.3,1)',filter:i===active?'drop-shadow(0 0 8px rgba(200,160,32,0.4))':'none' }}/>
                  {i===active&&<div style={{ position:'absolute',inset:-2,borderRadius:12,boxShadow:'0 0 0 1px rgba(200,160,32,0.4)',animation:'pulse-ring 2s ease-out infinite',pointerEvents:'none' }}/>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'center',perspective:800 }}>
            <div ref={imgRef} style={{ willChange:'transform,opacity' }}>
              <Phone src={SCREENS[active].src} glowColor="rgba(0,255,136,0.08)"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FEATURES SECTION ─────────────────────────────────────────────────
function FeaturesSection() {
  const ref=useRef(null)
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      gsap.fromTo('.feat-head',{opacity:0,y:30},{opacity:1,y:0,duration:0.9,ease:'power3.out',scrollTrigger:{trigger:ref.current,start:'top 75%'}})
      gsap.fromTo('.feat-card',{opacity:0,y:60,rotateX:12},{opacity:1,y:0,rotateX:0,duration:0.8,ease:'power3.out',stagger:0.08,scrollTrigger:{trigger:'.feat-grid',start:'top 80%'}})
    },ref)
    return ()=>ctx.revert()
  },[])
  return (
    <section id="features" ref={ref} style={{ padding:'140px 0',position:'relative' }}>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px' }}>
        <div className="feat-head" style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:72,flexWrap:'wrap',gap:24,opacity:0 }}>
          <div>
            <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,textTransform:'uppercase',marginBottom:16 }}>&gt; FONCTIONNALITES.SYS</div>
            <h2 style={{ fontFamily:'var(--serif)',fontSize:'clamp(32px,4vw,54px)',fontWeight:700,lineHeight:1.05,letterSpacing:-1.5 }}>Concu pour la realite<br/>africaine</h2>
          </div>
          <p style={{ fontSize:13,color:'var(--muted)',maxWidth:280,lineHeight:1.9,fontFamily:'var(--mono)' }}>
            // Chaque fonctionnalite repond<br/>// a un besoin reel du terrain
          </p>
        </div>
        <div className="feat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2 }}>
          {FEATURES.map(f=><div key={f.id} className="feat-card" style={{opacity:0}}><FeatureCard {...f}/></div>)}
        </div>
      </div>
    </section>
  )
}

// ── PROCESS ──────────────────────────────────────────────────────────
const STEPS=[
  {n:'01',title:'Creer le profil',desc:"Nom, telephone et code PIN. Donnees sur l'appareil uniquement."},
  {n:'02',title:'Creer une tontine',desc:"Devise, frequence, montant — configure en moins de 2 minutes."},
  {n:'03',title:'Ajouter les membres',desc:"Noms, telephones, photos. Ordre de rotation configurable."},
  {n:'04',title:'Gerer et suivre',desc:"Paiements, statistiques, exports — tout en temps reel."},
]
function ProcessSection() {
  const ref=useRef(null), line=useRef(null)
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      gsap.set(line.current,{scaleX:0,transformOrigin:'left'})
      const tl=gsap.timeline({scrollTrigger:{trigger:ref.current,start:'top 65%'}})
      tl.fromTo('.proc-head',{opacity:0,y:30},{opacity:1,y:0,duration:0.8,ease:'power3.out'})
        .to(line.current,{scaleX:1,duration:1.4,ease:'power2.inOut'},0.3)
        .fromTo('.step-block',{opacity:0,y:50},{opacity:1,y:0,duration:0.7,ease:'power3.out',stagger:0.15},0.5)
    },ref)
    return ()=>ctx.revert()
  },[])
  return (
    <section id="process" style={{ padding:'140px 0' }}>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px' }}>
        <div ref={ref}>
          <div className="proc-head" style={{ textAlign:'center',marginBottom:100,opacity:0 }}>
            <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,textTransform:'uppercase',marginBottom:16 }}>&gt; INIT.SEQUENCE</div>
            <h2 style={{ fontFamily:'var(--serif)',fontSize:'clamp(32px,4.5vw,58px)',fontWeight:700,letterSpacing:-2,lineHeight:1 }}>Operationnel en 5 minutes</h2>
          </div>
          <div className="steps-track" style={{ display:'flex',gap:0,position:'relative' }}>
            <div style={{ position:'absolute',top:22,left:60,right:60,height:1,background:'rgba(200,160,32,0.1)' }}>
              <div ref={line} style={{ height:'100%',background:'linear-gradient(90deg,var(--gold-hi),rgba(200,160,32,0.2))',boxShadow:'0 0 8px rgba(200,160,32,0.4)' }}/>
            </div>
            {STEPS.map((s,i)=>(
              <div key={i} className="step-block" style={{ flex:1,paddingRight:i<3?32:0,opacity:0 }}>
                <div style={{ width:44,height:44,borderRadius:2,border:'1px solid rgba(200,160,32,0.4)',background:'rgba(200,160,32,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontSize:12,color:'var(--gold-hi)',marginBottom:28,position:'relative',zIndex:1,boxShadow:'0 0 16px rgba(200,160,32,0.15)' }}>{s.n}</div>
                <div style={{ fontFamily:'var(--serif)',fontSize:20,fontWeight:600,marginBottom:10,letterSpacing:-0.3,lineHeight:1.2 }}>{s.title}</div>
                <div style={{ fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)',lineHeight:1.9 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── SECURITY ─────────────────────────────────────────────────────────
function SecuritySection() {
  const ref=useRef(null), phoneRef=useRef(null)
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      gsap.to(phoneRef.current,{y:-60,ease:'none',scrollTrigger:{trigger:ref.current,start:'top bottom',end:'bottom top',scrub:1.5}})
      gsap.fromTo('.sec-left',{opacity:0,x:-50},{opacity:1,x:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:ref.current,start:'top 70%'}})
      gsap.fromTo('.sec-item',{opacity:0,x:40},{opacity:1,x:0,duration:0.7,ease:'power3.out',stagger:0.12,scrollTrigger:{trigger:ref.current,start:'top 65%'}})
    },ref)
    return ()=>ctx.revert()
  },[])
  return (
    <section id="security" ref={ref} style={{ padding:'140px 0',background:'rgba(0,0,0,0.4)',overflow:'hidden' }}>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px' }}>
        <div className="sec-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:100,alignItems:'center' }}>
          <div className="sec-left" style={{ display:'flex',justifyContent:'center',position:'relative',opacity:0 }}>
            <div style={{ position:'absolute',inset:0,background:'radial-gradient(circle at 50% 40%,rgba(0,255,136,0.04),transparent 60%)',pointerEvents:'none' }}/>
            <div ref={phoneRef}><Phone src={S.login} style={{transform:'rotate(-3deg)'}} glowColor="rgba(0,255,136,0.12)"/></div>
          </div>
          <div>
            <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,textTransform:'uppercase',marginBottom:16 }}>&gt; SECURITY.PROTOCOL</div>
            <h2 style={{ fontFamily:'var(--serif)',fontSize:'clamp(32px,3.5vw,50px)',fontWeight:700,lineHeight:1.05,letterSpacing:-1.2,marginBottom:20 }}>Vos donnees<br/>vous appartiennent</h2>
            <p style={{ fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)',lineHeight:1.9,marginBottom:44 }}>
              // Aucun serveur, aucun cloud, zero pub<br/>// Stockage local chiffre uniquement
            </p>
            {[{id:'A1',label:'Code PIN + Biometrie',detail:'PIN chiffre dans SecureStore + empreinte / Face ID.'},{id:'A2',label:'Stockage 100% local',detail:'SQLite sur appareil. Zero transmission reseau.'},{id:'A3',label:'Sauvegarde portable',detail:'Export JSON via WhatsApp ou email. Restauration instantanee.'}].map(({id,label,detail})=>(
              <div key={id} className="sec-item" style={{ display:'flex',gap:18,padding:'18px 20px',background:'rgba(13,61,36,0.2)',border:'1px solid rgba(200,160,32,0.1)',borderRadius:2,alignItems:'flex-start',marginBottom:10,position:'relative',overflow:'hidden',opacity:0 }}>
                <HudCorners size={8} color="var(--gold)" opacity={0.2}/>
                <div style={{ fontFamily:'var(--mono)',fontSize:9,color:'var(--acid)',marginTop:3,letterSpacing:1,minWidth:28 }}>{id}</div>
                <div>
                  <div style={{ fontWeight:600,fontSize:14,marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)',lineHeight:1.7 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── HERO ─────────────────────────────────────────────────────────────
function HeroSection() {
  const eyeRef=useRef(null), subRef=useRef(null), ctaRef=useRef(null)
  const statsRef=useRef(null), phone1=useRef(null), phone2=useRef(null), scanRef=useRef(null)
  useLayoutEffect(()=>{
    const ctx=gsap.context(()=>{
      const tl=gsap.timeline()
      tl.fromTo(scanRef.current,{scaleY:0,opacity:0},{scaleY:1,opacity:1,duration:0.5,ease:'power2.out'})
        .to(scanRef.current,{x:'120vw',duration:1.2,ease:'power2.in'},0.3)
        .to(scanRef.current,{opacity:0,duration:0.2},1.2)
      tl.fromTo(eyeRef.current,{opacity:0,y:20},{opacity:1,y:0,duration:0.7,ease:'power3.out'},0.6)
      tl.fromTo(subRef.current,{opacity:0,y:20},{opacity:1,y:0,duration:0.8,ease:'power3.out'},1.6)
      tl.fromTo(ctaRef.current,{opacity:0,y:20},{opacity:1,y:0,duration:0.8,ease:'power3.out'},1.8)
      tl.fromTo(statsRef.current,{opacity:0,y:20},{opacity:1,y:0,duration:0.8,ease:'power3.out'},2.0)
      tl.fromTo(phone1.current,{opacity:0,x:120,rotation:-12},{opacity:1,x:0,rotation:-5,duration:1.2,ease:'power3.out'},0.9)
      tl.fromTo(phone2.current,{opacity:0,x:80,rotation:8},{opacity:1,x:0,rotation:4,duration:1.2,ease:'power3.out'},1.1)
      gsap.to(phone1.current,{y:-18,duration:5.5,ease:'sine.inOut',repeat:-1,yoyo:true,delay:2})
      gsap.to(phone2.current,{y:12,duration:6.5,ease:'sine.inOut',repeat:-1,yoyo:true,delay:2.5})
    })
    return ()=>ctx.revert()
  },[])
  return (
    <section style={{ minHeight:'100vh',display:'flex',alignItems:'center',padding:'130px 0 80px',position:'relative',overflow:'hidden' }}>
      <div ref={scanRef} style={{ position:'absolute',top:0,left:'-10vw',width:'8vw',height:'100%',zIndex:10,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.08),transparent)',filter:'blur(4px)' }}/>
      <div style={{ position:'absolute',top:'-20%',right:'-12%',width:900,height:900,borderRadius:'50%',background:'radial-gradient(circle,rgba(10,42,26,0.7) 0%,transparent 70%)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',opacity:0.04,backgroundImage:'linear-gradient(rgba(200,160,32,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(200,160,32,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px' }}/>
      <div style={{ position:'absolute',top:0,left:'50%',width:1,height:'40%',background:'linear-gradient(180deg,transparent,rgba(0,255,136,0.25),transparent)',pointerEvents:'none' }}/>
      <DataStream/>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px',width:'100%',position:'relative',zIndex:1 }}>
        <div className="hero-cols" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center' }}>
          <div>
            <div ref={eyeRef} style={{ opacity:0,display:'inline-flex',alignItems:'center',gap:10,background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:2,padding:'7px 18px',marginBottom:36 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--acid)',boxShadow:'0 0 8px var(--acid)',animation:'flicker 3s infinite' }}/>
              <span style={{ fontFamily:'var(--mono)',fontSize:10,letterSpacing:2.5,textTransform:'uppercase',color:'var(--acid)' }}>SYS.BOOT — Application mobile active</span>
            </div>
            <TypewriterTitle/>
            <p ref={subRef} style={{ opacity:0,fontFamily:'var(--mono)',fontSize:13,lineHeight:1.9,color:'var(--muted)',maxWidth:440,marginBottom:48 }}>
              // Gerez vos groupes d'epargne solidaire<br/>// Cotisations, rotations, rapports<br/>// Zero connexion requise
            </p>
            <div ref={ctaRef} style={{ opacity:0,display:'flex',gap:14,flexWrap:'wrap',marginBottom:64 }}>
              <a href="#download" data-cursor="DOWNLOAD" style={{ display:'inline-flex',alignItems:'center',gap:10,background:'var(--gold)',color:'var(--void)',padding:'14px 32px',borderRadius:2,fontFamily:'var(--mono)',fontSize:11,fontWeight:600,letterSpacing:2,textTransform:'uppercase',boxShadow:'0 0 30px rgba(200,160,32,0.3)',transition:'all 0.3s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--gold-hi)'; e.currentTarget.style.boxShadow='0 0 50px rgba(200,160,32,0.5)'; e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--gold)'; e.currentTarget.style.boxShadow='0 0 30px rgba(200,160,32,0.3)'; e.currentTarget.style.transform='translateY(0)'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 16V4M12 16l-4-4M12 16l4-4"/><rect x="4" y="18" width="16" height="2" rx="0" fill="currentColor" stroke="none"/></svg>
                Telecharger
              </a>
              <a href="#screens" data-cursor="VOIR" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'transparent',color:'var(--muted)',padding:'14px 24px',borderRadius:2,fontFamily:'var(--mono)',fontSize:11,letterSpacing:2,textTransform:'uppercase',border:'1px solid rgba(200,160,32,0.2)',transition:'all 0.3s' }}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='rgba(200,160,32,0.45)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor='rgba(200,160,32,0.2)'}}
              >
                Voir la demo <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
            <div ref={statsRef} style={{ opacity:0,display:'flex',gap:56,paddingTop:36,borderTop:'1px solid rgba(200,160,32,0.1)',flexWrap:'wrap' }}>
              <Counter to={100} suffix="%" label="Hors ligne"/>
              <Counter to={6} suffix="+" label="Devises FCFA"/>
              <Counter to={0} suffix=" FCFA" label="Prix"/>
            </div>
          </div>
          <div className="phones-wrap" style={{ display:'flex',gap:22,alignItems:'flex-end',justifyContent:'flex-end' }}>
            <div ref={phone1} style={{ opacity:0,willChange:'transform' }}><Phone src={S.login} glowColor="rgba(200,160,32,0.1)" style={{transform:'rotate(-5deg)'}}/></div>
            <div ref={phone2} style={{ opacity:0,willChange:'transform' }}><Phone src={S.dashboard_dark} glowColor="rgba(0,255,136,0.07)" style={{transform:'rotate(4deg)',marginBottom:-24}}/></div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────
function CTASection() {
  const ref=useRef(null), ringA=useRef(null), ringB=useRef(null)
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      const tl=gsap.timeline({scrollTrigger:{trigger:ref.current,start:'top 65%'}})
      tl.fromTo(ringA.current,{scale:0.5,opacity:0},{scale:1,opacity:1,duration:1.4,ease:'power3.out'})
        .fromTo(ringB.current,{scale:0.3,opacity:0},{scale:1,opacity:1,duration:1.6,ease:'power3.out'},0.1)
        .fromTo('.cta-el',{opacity:0,y:40},{opacity:1,y:0,duration:0.8,ease:'power3.out',stagger:0.1},0.4)
      gsap.to(ringA.current,{rotation:360,duration:40,ease:'none',repeat:-1})
      gsap.to(ringB.current,{rotation:-360,duration:60,ease:'none',repeat:-1})
    },ref)
    return ()=>ctx.revert()
  },[])
  return (
    <section id="download" ref={ref} style={{ padding:'160px 0',textAlign:'center',position:'relative',overflow:'hidden' }}>
      <div ref={ringA} style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:700,borderRadius:'50%',border:'1px solid rgba(200,160,32,0.06)',pointerEvents:'none' }}/>
      <div ref={ringB} style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:500,borderRadius:'50%',border:'1px dashed rgba(0,255,136,0.08)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,61,36,0.4),transparent)',pointerEvents:'none' }}/>
      <div style={{ maxWidth:680,margin:'0 auto',padding:'0 32px',position:'relative' }}>
        <div className="cta-el" style={{ opacity:0,fontFamily:'var(--mono)',fontSize:10,color:'var(--acid)',letterSpacing:3,textTransform:'uppercase',marginBottom:28 }}>&gt; DEPLOY.READY</div>
        <h2 className="cta-el" style={{ opacity:0,fontFamily:'var(--serif)',fontSize:'clamp(44px,7vw,90px)',fontWeight:700,lineHeight:0.92,letterSpacing:-3,marginBottom:28 }}>
          Votre tontine,<br/><em style={{ fontStyle:'italic',color:'var(--gold)',textShadow:'0 0 40px rgba(200,160,32,0.3)' }}>dans votre poche</em>
        </h2>
        <p className="cta-el" style={{ opacity:0,fontFamily:'var(--mono)',fontSize:13,color:'var(--muted)',lineHeight:1.9,marginBottom:56 }}>
          // Gratuit, sans publicite, sans compte cloud<br/>// Operationnel en moins de 5 minutes
        </p>
        <div className="cta-el" style={{ opacity:0,display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:40 }}>
          <a href="#" data-cursor="DOWNLOAD" style={{ display:'inline-flex',alignItems:'center',gap:10,background:'var(--gold)',color:'var(--void)',padding:'16px 40px',borderRadius:2,fontFamily:'var(--mono)',fontSize:12,fontWeight:600,letterSpacing:2,textTransform:'uppercase',boxShadow:'0 0 40px rgba(200,160,32,0.35)',transition:'all 0.35s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--gold-hi)'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 0 60px rgba(200,160,32,0.55)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--gold)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 40px rgba(200,160,32,0.35)'}}
          >Google Play</a>
          <a href="#" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'transparent',color:'var(--muted)',padding:'16px 32px',borderRadius:2,fontFamily:'var(--mono)',fontSize:12,letterSpacing:2,textTransform:'uppercase',border:'1px solid rgba(200,160,32,0.2)',transition:'all 0.3s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='rgba(200,160,32,0.4)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor='rgba(200,160,32,0.2)'}}
          >App Store (bientot)</a>
        </div>
        <div className="cta-el" style={{ opacity:0,display:'flex',gap:32,justifyContent:'center',flexWrap:'wrap' }}>
          {['Gratuit','Sans publicite','Hors ligne','FCFA natif'].map(t=>(
            <span key={t} style={{ display:'flex',alignItems:'center',gap:8,fontFamily:'var(--mono)',fontSize:10,color:'rgba(90,112,96,0.6)',letterSpacing:1.5,textTransform:'uppercase' }}>
              <span style={{ width:4,height:4,borderRadius:0,background:'var(--gold)',opacity:0.5,transform:'rotate(45deg)',display:'inline-block',flexShrink:0 }}/>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop:'1px solid rgba(200,160,32,0.1)',padding:'48px 0' }}>
      <div style={{ maxWidth:1160,margin:'0 auto',padding:'0 32px' }}>
        <div className="footer-cols" style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:24 }}>
          <a href="#" style={{ display:'flex',alignItems:'center',gap:10 }}>
            <img src={S.icon} alt="" style={{ width:26,height:26,borderRadius:8,filter:'drop-shadow(0 0 6px rgba(200,160,32,0.3))' }}/>
            <span style={{ fontFamily:'var(--serif)',fontSize:20,fontWeight:600 }}>Tontine<span style={{color:'var(--gold)'}}>Plus</span></span>
          </a>
          <div style={{ display:'flex',gap:28 }}>
            {['Confidentialite','Conditions','Contact'].map(l=>(
              <a key={l} href="#" style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--muted)',letterSpacing:2,textTransform:'uppercase',transition:'color 0.3s' }}
                onMouseEnter={e=>e.target.style.color='var(--gold)'}
                onMouseLeave={e=>e.target.style.color='var(--muted)'}
              >{l}</a>
            ))}
          </div>
          <div style={{ fontFamily:'var(--mono)',fontSize:10,color:'rgba(90,112,96,0.35)',letterSpacing:1.5 }}>BUILD 2025 · TONTINEPLUS · AFRIQUE</div>
        </div>
      </div>
    </footer>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────
export default function App() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>60)
    window.addEventListener('scroll',fn,{passive:true})
    return ()=>window.removeEventListener('scroll',fn)
  },[])
  return (
    <>
      <Cursor/>
      <Nav scrolled={scrolled}/>
      <HeroSection/>
      <Ticker/>
      <FeaturesSection/>
      <ScreensSection/>
      <ProcessSection/>
      <SecuritySection/>
      <CTASection/>
      <Footer/>
    </>
  )
}
