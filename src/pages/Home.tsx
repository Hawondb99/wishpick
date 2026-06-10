import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'
import Group from './Group'
import Profile from './Profile'
import Notifications from './Notifications'
import AlertHistory from './AlertHistory'
import MyWishes from './MyWishes'

const eventEmoji: Record<string, string> = {
  '생일': '🎂', 'birthday': '🎂', '결혼기념일': '💑', '연애기념일': '💕',
  '졸업': '🎓', '입사/승진': '💼', '결혼': '💍', '베이비샤워': '👶',
  '돌잔치': '🎈', '집들이': '🏠', '크리스마스': '🎄', '발렌타인데이': '💝',
  '화이트데이': '🤍', '명절': '🎆', '기타': '📅'
}

interface DdayCard {
  groupId: string; groupName: string; memberName: string
  eventType: string; eventTitle: string; dday: number
  wishCount: number; memberId: string
}

const GROUP_TYPES_KO = ['커플', '가족', '친구', '직장', '기타']
const GROUP_TYPES_EN = ['Couple', 'Family', 'Friends', 'Work', 'Other']

export default function Home({ session }: { session: any }) {
  const { t, lang } = useLang()
  const [groups, setGroups] = useState<any[]>([])
  const [currentGroup, setCurrentGroup] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAlertHistory, setShowAlertHistory] = useState(false)
  const [showMyWishes, setShowMyWishes] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState(lang === 'ko' ? '친구' : 'Friends')
  const [newGroupCustomType, setNewGroupCustomType] = useState('')
  const [newGroupVisibility, setNewGroupVisibility] = useState('surprise')
  const [newEventMode, setNewEventMode] = useState('individual')
  const [newGroupEventType, setNewGroupEventType] = useState('생일')
  const [newGroupEventTitle, setNewGroupEventTitle] = useState('')
  const [newGroupEventDate, setNewGroupEventDate] = useState('')
  const [newGroupCustomEvent, setNewGroupCustomEvent] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ddayCards, setDdayCards] = useState<DdayCard[]>([])
  const [recentWishes, setRecentWishes] = useState<any[]>([])

  const GROUP_TYPES = lang === 'ko' ? GROUP_TYPES_KO : GROUP_TYPES_EN
  const isCustomGroupType = newGroupType === '기타' || newGroupType === 'Other'
    || (!GROUP_TYPES_KO.includes(newGroupType) && !GROUP_TYPES_EN.includes(newGroupType) && newGroupType !== '')

  useEffect(() => { fetchProfile(); fetchGroups() }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }

  const fetchGroups = async () => {
    const { data } = await supabase.from('group_members').select('group_id, groups(*)').eq('user_id', session.user.id)
    if (data) {
      const groupList = data.map((d: any) => d.groups).filter(Boolean)
      setGroups(groupList)
      await fetchDdayCards(groupList)
      await fetchRecentWishes(groupList)
    }
    setLoading(false)
  }

  const fetchRecentWishes = async (groupList: any[]) => {
    if (!groupList.length) return
    const groupIds = groupList.map(g => g.id)
    const { data } = await supabase.from('wishes')
      .select('*, groups(name)')
      .in('group_id', groupIds)
      .neq('user_id', session.user.id)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setRecentWishes(data)
  }

  const fetchDdayCards = async (groupList: any[]) => {
    const cards: DdayCard[] = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data: myProfile } = await supabase.from('profiles').select('dday_alert_days').eq('id', session.user.id).single()
    const alertDays = myProfile?.dday_alert_days || 30
    const maxDays = alertDays === 9999 ? 99999 : alertDays
    const { data: notifSettings } = await supabase.from('notification_settings').select('*').eq('user_id', session.user.id)
    const isEventEnabled = (groupId: string, eventType: string) => {
      if (!notifSettings) return true
      const s = notifSettings.find(s => s.group_id === groupId && s.event_type === eventType)
      return s ? s.is_enabled : true
    }
    for (const g of groupList) {
      if (g.event_mode === 'group' && g.group_event_type) {
        if (g.group_event_type === '생일') {
          if (!isEventEnabled(g.id, '생일')) continue
          const { data: members } = await supabase.from('group_members').select('profiles(id,name,birthday)').eq('group_id', g.id)
          if (members) for (const m of members) {
            const p: any = m.profiles
            if (p?.birthday && p.id !== session.user.id) {
              const bd = new Date(p.birthday); bd.setFullYear(today.getFullYear())
              if (bd < today) bd.setFullYear(today.getFullYear() + 1)
              const diff = Math.ceil((bd.getTime() - today.getTime()) / 86400000)
              if (diff <= maxDays) {
                const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('user_id', p.id).eq('status', 'available')
                cards.push({ groupId: g.id, groupName: g.name, memberName: p.name, eventType: '생일', eventTitle: lang === 'ko' ? `${p.name}님 생일` : `${p.name}'s Birthday`, dday: diff, wishCount: wishes?.length || 0, memberId: p.id })
              }
            }
          }
        } else if (g.group_event_date) {
          if (!isEventEnabled(g.id, g.group_event_type)) continue
          const diff = Math.ceil((new Date(g.group_event_date).getTime() - today.getTime()) / 86400000)
          if (diff >= 0 && diff <= maxDays) {
            const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('status', 'available')
            cards.push({ groupId: g.id, groupName: g.name, memberName: '', eventType: g.group_event_type, eventTitle: g.group_event_title || g.group_event_type, dday: diff, wishCount: wishes?.length || 0, memberId: '' })
          }
        }
      }
      if (g.event_mode === 'individual') {
        const { data: members } = await supabase.from('group_members').select('profiles(id,name,birthday)').eq('group_id', g.id)
        if (members) for (const m of members) {
          const p: any = m.profiles
          if (p?.birthday && p.id !== session.user.id) {
            if (!isEventEnabled(g.id, '생일')) continue
            const bd = new Date(p.birthday); bd.setFullYear(today.getFullYear())
            if (bd < today) bd.setFullYear(today.getFullYear() + 1)
            const diff = Math.ceil((bd.getTime() - today.getTime()) / 86400000)
            if (diff <= maxDays) {
              const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('user_id', p.id).eq('status', 'available')
              cards.push({ groupId: g.id, groupName: g.name, memberName: p.name, eventType: '생일', eventTitle: lang === 'ko' ? `${p.name}님 생일` : `${p.name}'s Birthday`, dday: diff, wishCount: wishes?.length || 0, memberId: p.id })
            }
          }
        }
        const { data: events } = await supabase.from('events').select('*,profiles(name)').eq('is_group_event', false).neq('user_id', session.user.id)
        if (events && members) for (const ev of events) {
          const memberInGroup = members.find((m: any) => m.profiles?.id === ev.user_id)
          if (!memberInGroup || !ev.event_date) continue
          if (!isEventEnabled(g.id, ev.event_type)) continue
          const evDate = new Date(ev.event_date)
          if (ev.is_recurring) { evDate.setFullYear(today.getFullYear()); if (evDate < today) evDate.setFullYear(today.getFullYear() + 1) }
          const diff = Math.ceil((evDate.getTime() - today.getTime()) / 86400000)
          if (diff >= 0 && diff <= maxDays) {
            const p: any = memberInGroup.profiles
            cards.push({ groupId: g.id, groupName: g.name, memberName: p?.name || '', eventType: ev.event_type, eventTitle: ev.title, dday: diff, wishCount: 0, memberId: ev.user_id })
          }
        }
      }
    }
    cards.sort((a, b) => a.dday - b.dday)
    setDdayCards(cards)
  }

  const resetCreateForm = () => {
    setNewGroupName(''); setNewGroupType(lang === 'ko' ? '친구' : 'Friends')
    setNewGroupCustomType(''); setNewGroupVisibility('surprise')
    setNewEventMode('individual'); setNewGroupEventType('생일')
    setNewGroupEventTitle(''); setNewGroupEventDate(''); setNewGroupCustomEvent('')
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) { alert(lang === 'ko' ? '그룹 이름을 입력해주세요!' : 'Please enter a group name!'); return }
    const code = Math.random().toString(36).substr(2, 6).toUpperCase()
    const eventType = newGroupEventType === '기타' ? newGroupCustomEvent : newGroupEventType
    const finalGroupType = newGroupCustomType.trim() || newGroupType
    const { data: groupData, error: groupError } = await supabase.from('groups').insert({
      name: newGroupName.trim(), group_type: finalGroupType, invite_code: code,
      created_by: session.user.id, buyer_visibility: newGroupVisibility,
      event_mode: newEventMode,
      group_event_type: newEventMode === 'group' ? eventType : null,
      group_event_title: newEventMode === 'group' ? (newGroupEventTitle || eventType) : null,
      group_event_date: newEventMode === 'group' && newGroupEventType !== '생일' ? newGroupEventDate : null,
    }).select().single()
    if (groupError) { alert('Error: ' + groupError.message); return }
    await supabase.from('group_members').insert({ group_id: groupData.id, user_id: session.user.id })
    setGroups(prev => [...prev, groupData]); setShowCreate(false); resetCreateForm()
    alert(lang === 'ko' ? '🎉 그룹이 만들어졌어요!' : '🎉 Group created!')
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) return
    const { data: group } = await supabase.from('groups').select('*').eq('invite_code', joinCode.toUpperCase()).single()
    if (!group) { alert(lang === 'ko' ? '❌ 초대 코드를 찾을 수 없어요!' : '❌ Invalid invite code!'); return }
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: session.user.id })
    if (!error) { setGroups(prev => [...prev, group]); setShowJoin(false); setJoinCode(''); alert(lang === 'ko' ? `🎉 "${group.name}" 그룹에 참여했어요!` : `🎉 Joined "${group.name}"!`) }
    else alert(lang === 'ko' ? '이미 참여한 그룹이에요!' : 'Already a member!')
  }

  const groupTypeEmoji: Record<string, string> = {
    '커플': '💑', '가족': '👨‍👩‍👧', '친구': '👥', '직장': '💼', '기타': '🎁',
    'Couple': '💑', 'Family': '👨‍👩‍👧', 'Friends': '👥', 'Work': '💼', 'Other': '🎁'
  }
  const groupTypeLabel = (type: string) => {
    if (lang === 'en') {
      const map: Record<string, string> = { '커플': 'Couple', '가족': 'Family', '친구': 'Friends', '직장': 'Work', '기타': 'Other' }
      return map[type] || type
    }
    return type
  }

  // ── 페이지 라우팅 ──
  if (showMyWishes) return (
    <MyWishes session={session} onBack={() => setShowMyWishes(false)} />
  )
  if (showProfile) return (
    <Profile
      session={session}
      onBack={() => { fetchProfile(); setShowProfile(false) }}
      onGoNotifications={() => { setShowProfile(false); setShowNotifications(true) }}
      onGoMyWishes={() => { setShowProfile(false); setShowMyWishes(true) }}
    />
  )
  if (showNotifications) return (
    <Notifications session={session} onBack={() => setShowNotifications(false)} />
  )
  if (showAlertHistory) return (
    <AlertHistory
      session={session}
      onBack={() => setShowAlertHistory(false)}
      onGoGroup={(groupId) => {
        setShowAlertHistory(false)
        const g = groups.find(g => g.id === groupId)
        if (g) setCurrentGroup(g)
      }}
    />
  )
  if (currentGroup) return (
    <Group group={currentGroup} session={session} onBack={() => { setCurrentGroup(null); fetchGroups() }} />
  )

  const EVENT_TYPES_LOCAL = lang === 'ko'
    ? ['생일','결혼기념일','연애기념일','졸업','입사/승진','결혼','베이비샤워','돌잔치','집들이','크리스마스','발렌타인데이','화이트데이','명절','기타']
    : ['Birthday','Anniversary','Graduation','Promotion','Wedding','Baby Shower','Housewarming','Christmas',"Valentine's Day",'Other']

  const topDday = ddayCards[0]

  return (
    <div style={s.container}>

      {/* ── 헤더 ── */}
      <div style={s.header}>
        <span style={s.logo}>WishPick</span>
        <button style={s.bellBtn} onClick={() => setShowAlertHistory(true)}>
          🔔
          {ddayCards.length > 0 && <span style={s.bellDot} />}
        </button>
      </div>

      <div style={s.scroll}>

        {/* ── 그룹 원형 가로스크롤 ── */}
        <div style={s.groupRow}>
          <div style={s.groupItem} onClick={() => { resetCreateForm(); setShowCreate(true) }}>
            <div style={{...s.groupCircle, background:'#111827'}}>
              <span style={{fontSize:'22px', color:'white', lineHeight:1}}>+</span>
            </div>
            <span style={s.groupLabel}>{lang === 'ko' ? '그룹 만들기' : 'New Group'}</span>
          </div>
          {groups.map(g => (
            <div key={g.id} style={s.groupItem} onClick={() => setCurrentGroup(g)}>
              <div style={s.groupCircle}>
                <span style={{fontSize:'24px'}}>{groupTypeEmoji[g.group_type] || '🎁'}</span>
              </div>
              <span style={{...s.groupLabel, maxWidth:'60px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{g.name}</span>
            </div>
          ))}
          <div style={s.groupItem} onClick={() => setShowJoin(true)}>
            <div style={{...s.groupCircle, background:'#F3F4F6'}}>
              <span style={{fontSize:'22px'}}>📩</span>
            </div>
            <span style={s.groupLabel}>{lang === 'ko' ? '코드참여' : 'Join'}</span>
          </div>
        </div>

        {/* ── D-day 배너 ── */}
        {topDday && (
          <div style={s.ddayBanner} onClick={() => { const g = groups.find(g => g.id === topDday.groupId); if (g) setCurrentGroup(g) }}>
            <div>
              <p style={s.ddayBannerSub}>{lang === 'ko' ? '다가오는 이벤트' : 'Upcoming Event'}</p>
              <p style={s.ddayBannerTitle}>
                {topDday.memberName
                  ? (lang === 'ko' ? `${topDday.memberName} 생일 D-${topDday.dday}` : `${topDday.memberName}'s Birthday D-${topDday.dday}`)
                  : `${topDday.eventTitle} D-${topDday.dday}`}
              </p>
              <p style={s.ddayBannerDate}>{topDday.groupName}</p>
            </div>
            <span style={{fontSize:'40px'}}>{eventEmoji[topDday.eventType] || '📅'}</span>
          </div>
        )}

        {/* ── 최근 추가된 위시 ── */}
        {recentWishes.length > 0 && (
          <div style={{marginBottom:'28px'}}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>{lang === 'ko' ? '최근 추가된 선물' : 'Recently Added'}</span>
              <span style={s.sectionMore} onClick={() => groups.length > 0 && setCurrentGroup(groups[0])}>
                {lang === 'ko' ? '전체보기 ›' : 'See all ›'}
              </span>
            </div>
            <div style={s.wishScroll}>
              {recentWishes.map(w => (
                <div key={w.id} style={s.wishCard} onClick={() => { const g = groups.find(g => g.id === w.group_id); if (g) setCurrentGroup(g) }}>
                  <div style={s.wishThumb}>
                    {w.image_url
                      ? <img src={w.image_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px'}} onError={e=>{e.currentTarget.style.display='none'}} />
                      : <span style={{fontSize:'28px'}}>🎁</span>}
                  </div>
                  <div style={{padding:'8px 4px 0'}}>
                    <p style={s.wishName}>{w.name}</p>
                    <p style={s.wishPrice}>{w.price ? `₩${w.price.toLocaleString()}` : (lang === 'ko' ? '가격 미정' : 'No price')}</p>
                    <p style={s.wishGroup}>{w.groups?.name || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 내 그룹 리스트 ── */}
        <div style={{padding:'0 20px 120px'}}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>{lang === 'ko' ? '내 그룹' : 'My Groups'}</span>
          </div>
          {loading ? (
            <div style={{textAlign:'center', padding:'48px', fontSize:'28px'}}>🎁</div>
          ) : groups.length === 0 ? (
            <div style={s.empty}>
              <p style={{fontSize:'44px', margin:'0 0 14px'}}>🎁</p>
              <p style={{fontWeight:700, fontSize:'17px', color:'#111827', margin:'0 0 6px'}}>{t.no_groups}</p>
              <p style={{fontSize:'13px', color:'#9CA3AF', margin:0}}>{t.no_groups_desc}</p>
            </div>
          ) : groups.map(g => (
            <div key={g.id} style={s.groupListCard} onClick={() => setCurrentGroup(g)}>
              <div style={s.groupListIcon}>
                <span style={{fontSize:'26px'}}>{groupTypeEmoji[g.group_type] || '🎁'}</span>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={s.groupListName}>{g.name}</p>
                <p style={s.groupListMeta}>{groupTypeLabel(g.group_type)}</p>
              </div>
              <span style={{fontSize:'18px', color:'#D1D5DB'}}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단 탭바 ── */}
      <div style={s.tabBar}>
        <button style={s.tabBtn}>
          <span style={{fontSize:'20px'}}>🏠</span>
          <span style={{...s.tabTxt, color:'#111827', fontWeight:700}}>{lang==='ko'?'홈':'Home'}</span>
        </button>
        <button style={s.tabBtn} onClick={() => setShowMyWishes(true)}>
          <span style={{fontSize:'20px'}}>🎁</span>
          <span style={{...s.tabTxt, color:'#9CA3AF'}}>{lang==='ko'?'위시리스트':'Wishlist'}</span>
        </button>
        <button style={s.tabBtn} onClick={() => { resetCreateForm(); setShowCreate(true) }}>
          <div style={s.tabPlusBtn}>
            <span style={{fontSize:'26px', color:'white', lineHeight:1}}>+</span>
          </div>
        </button>
        <button style={s.tabBtn} onClick={() => setShowNotifications(true)}>
          <span style={{fontSize:'20px'}}>🔔</span>
          <span style={{...s.tabTxt, color:'#9CA3AF'}}>{lang==='ko'?'알림설정':'Alerts'}</span>
        </button>
        <button style={s.tabBtn} onClick={() => setShowProfile(true)}>
          <span style={{fontSize:'20px'}}>👤</span>
          <span style={{...s.tabTxt, color:'#9CA3AF'}}>{lang==='ko'?'마이페이지':'My'}</span>
        </button>
      </div>

      {/* ── 그룹 만들기 모달 ── */}
      {showCreate && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); resetCreateForm() } }}>
          <div style={{...s.modal, maxHeight:'92vh', overflowY:'auto'}}>
            <div style={s.handle} />
            <p style={s.modalTitle}>{lang==='ko'?'새 그룹 만들기':'New Group'}</p>
            <p style={s.inputLabel}>{lang==='ko'?'그룹 이름':'Group Name'}</p>
            <input style={s.input} placeholder={lang==='ko'?'그룹 이름 *':'Group Name *'} value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} />
            <p style={s.inputLabel}>{lang==='ko'?'그룹 종류':'Group Type'}</p>
            <div style={{display:'flex', gap:'8px', marginBottom:'8px', flexWrap:'wrap'}}>
              {GROUP_TYPES.map(type => (
                <div key={type} onClick={() => { setNewGroupType(type); setNewGroupCustomType('') }} style={{
                  padding:'8px 16px', borderRadius:'50px', cursor:'pointer', fontSize:'13px', fontWeight:500,
                  border:`1.5px solid ${newGroupType===type?'#111827':'#E5E7EB'}`,
                  background: newGroupType===type?'#111827':'white',
                  color: newGroupType===type?'white':'#374151'
                }}>{type}</div>
              ))}
            </div>
            {isCustomGroupType && (
              <input style={{...s.input, marginBottom:'16px'}}
                placeholder={lang==='ko'?'그룹 종류 직접 입력':'Custom type'}
                value={newGroupCustomType} onChange={e=>setNewGroupCustomType(e.target.value)} />
            )}
            <p style={s.inputLabel}>📅 {lang==='ko'?'이벤트 설정':'Event Settings'}</p>
            <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
              {[
                {value:'individual', label:lang==='ko'?'👤 개별':'👤 Individual', desc:lang==='ko'?'각자의 생일·기념일':'Each member'},
                {value:'group', label:lang==='ko'?'🎉 공통':'🎉 Group', desc:lang==='ko'?'베이비샤워 등':'Baby shower...'}
              ].map(opt => (
                <div key={opt.value} onClick={() => setNewEventMode(opt.value)} style={{
                  flex:1, padding:'10px', borderRadius:'12px', cursor:'pointer', textAlign:'center',
                  border:`1.5px solid ${newEventMode===opt.value?'#111827':'#E5E7EB'}`,
                  background: newEventMode===opt.value?'#111827':'white'
                }}>
                  <p style={{fontSize:'13px', fontWeight:600, color:newEventMode===opt.value?'white':'#374151', margin:0}}>{opt.label}</p>
                  <p style={{fontSize:'11px', color:newEventMode===opt.value?'rgba(255,255,255,0.6)':'#9CA3AF', margin:'2px 0 0'}}>{opt.desc}</p>
                </div>
              ))}
            </div>
            {newEventMode === 'group' && (
              <div style={{background:'#F9FAFB', borderRadius:'12px', padding:'12px', marginBottom:'12px'}}>
                <select style={s.input} value={newGroupEventType} onChange={e=>setNewGroupEventType(e.target.value)}>
                  {EVENT_TYPES_LOCAL.map(t => <option key={t}>{t}</option>)}
                </select>
                <input style={s.input} placeholder={lang==='ko'?'이벤트 이름':'Event name'} value={newGroupEventTitle} onChange={e=>setNewGroupEventTitle(e.target.value)} />
                {newGroupEventType !== '생일' && newGroupEventType !== 'Birthday' && (
                  <input style={{...s.input, marginBottom:0}} type="date" value={newGroupEventDate} onChange={e=>setNewGroupEventDate(e.target.value)} />
                )}
              </div>
            )}
            <p style={s.inputLabel}>👀 {lang==='ko'?'구매자 공개 설정':'Buyer Visibility'}</p>
            {[
              {value:'surprise', label:lang==='ko'?'🎁 서프라이즈':'🎁 Surprise', desc:lang==='ko'?'받는 사람에게 숨겨요':'Hidden from recipient'},
              {value:'public', label:lang==='ko'?'👀 공개':'👀 Public', desc:lang==='ko'?'모두 볼 수 있어요':'Everyone can see'},
              {value:'private', label:lang==='ko'?'🔒 비공개':'🔒 Private', desc:lang==='ko'?'모두에게 숨겨요':'Hidden from all'},
            ].map(opt => (
              <div key={opt.value} onClick={() => setNewGroupVisibility(opt.value)} style={{
                padding:'12px 14px', marginBottom:'8px', borderRadius:'12px', cursor:'pointer',
                border:`1.5px solid ${newGroupVisibility===opt.value?'#111827':'#E5E7EB'}`,
                background: newGroupVisibility===opt.value?'#111827':'white',
                display:'flex', alignItems:'center', justifyContent:'space-between'
              }}>
                <div>
                  <p style={{fontSize:'14px', fontWeight:600, color:newGroupVisibility===opt.value?'white':'#111827', margin:0}}>{opt.label}</p>
                  <p style={{fontSize:'12px', color:newGroupVisibility===opt.value?'rgba(255,255,255,0.6)':'#9CA3AF', margin:'2px 0 0'}}>{opt.desc}</p>
                </div>
                {newGroupVisibility===opt.value && <span style={{color:'white', fontSize:'16px'}}>✓</span>}
              </div>
            ))}
            <button style={s.btn} onClick={createGroup}>{lang==='ko'?'그룹 만들기':'Create Group'}</button>
            <button style={s.cancelBtn} onClick={() => { setShowCreate(false); resetCreateForm() }}>{lang==='ko'?'취소':'Cancel'}</button>
          </div>
        </div>
      )}

      {/* ── 참여 모달 ── */}
      {showJoin && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowJoin(false) }}>
          <div style={s.modal}>
            <div style={s.handle} />
            <p style={s.modalTitle}>{lang==='ko'?'코드로 참여하기':'Join with Code'}</p>
            <input style={{...s.input, textAlign:'center', letterSpacing:'8px', fontSize:'24px', fontWeight:700, textTransform:'uppercase'}}
              placeholder="XXXXXX" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
            <button style={s.btn} onClick={joinGroup}>{lang==='ko'?'참여하기':'Join'}</button>
            <button style={s.cancelBtn} onClick={() => setShowJoin(false)}>{lang==='ko'?'취소':'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', display:'flex', flexDirection:'column' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'54px 20px 14px', background:'#fff', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  logo: { fontSize:'20px', fontWeight:800, color:'#111827', letterSpacing:'-0.8px' },
  bellBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', padding:'4px', position:'relative' },
  bellDot: { position:'absolute', top:'4px', right:'4px', width:'8px', height:'8px', background:'#EF4444', borderRadius:'50%', border:'2px solid white' },
  scroll: { flex:1, overflowY:'auto' },
  groupRow: { display:'flex', gap:'16px', padding:'20px 20px 8px', overflowX:'auto', alignItems:'flex-start' },
  groupItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', flexShrink:0, cursor:'pointer' },
  groupCircle: { width:'60px', height:'60px', borderRadius:'50%', background:'#F3F4F6', border:'1.5px solid #EFEFEF', display:'flex', alignItems:'center', justifyContent:'center' },
  groupLabel: { fontSize:'11px', color:'#374151', fontWeight:500, textAlign:'center', margin:0 },
  ddayBanner: { margin:'8px 20px 20px', background:'#F9F9F9', borderRadius:'20px', padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:'1px solid #F0F0F0' },
  ddayBannerSub: { fontSize:'11px', color:'#9CA3AF', margin:'0 0 4px', fontWeight:500 },
  ddayBannerTitle: { fontSize:'20px', fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-0.5px', lineHeight:1.3 },
  ddayBannerDate: { fontSize:'12px', color:'#9CA3AF', margin:0 },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', marginBottom:'14px' },
  sectionTitle: { fontSize:'16px', fontWeight:700, color:'#111827', letterSpacing:'-0.3px' },
  sectionMore: { fontSize:'13px', color:'#9CA3AF', cursor:'pointer' },
  wishScroll: { display:'flex', gap:'14px', padding:'0 20px', overflowX:'auto' },
  wishCard: { flexShrink:0, width:'130px', cursor:'pointer' },
  wishThumb: { width:'130px', height:'130px', background:'#F5F5F5', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  wishName: { fontSize:'13px', fontWeight:600, color:'#111827', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  wishPrice: { fontSize:'13px', fontWeight:700, color:'#111827', margin:'0 0 2px' },
  wishGroup: { fontSize:'11px', color:'#9CA3AF', margin:0 },
  groupListCard: { display:'flex', alignItems:'center', gap:'14px', padding:'14px 0', borderBottom:'1px solid #F5F5F5', cursor:'pointer' },
  groupListIcon: { width:'50px', height:'50px', borderRadius:'16px', background:'#F5F5F5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  groupListName: { fontSize:'15px', fontWeight:600, color:'#111827', margin:'0 0 3px' },
  groupListMeta: { fontSize:'12px', color:'#9CA3AF', margin:0 },
  empty: { textAlign:'center', padding:'60px 24px' },
  tabBar: { position:'fixed', bottom:0, left:0, right:0, maxWidth:'480px', margin:'0 auto', background:'#fff', borderTop:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'10px 0 28px', zIndex:100 },
  tabBtn: { background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'0 8px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  tabTxt: { fontSize:'10px', margin:0 },
  tabPlusBtn: { width:'52px', height:'52px', borderRadius:'50%', background:'#111827', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'2px' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 44px' },
  handle: { width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 24px' },
  modalTitle: { fontSize:'22px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' },
  inputLabel: { fontSize:'12px', fontWeight:600, color:'#9CA3AF', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.5px' },
  input: { width:'100%', padding:'14px 16px', marginBottom:'12px', border:'1.5px solid #F0F0F0', borderRadius:'12px', fontSize:'15px', outline:'none', boxSizing:'border-box', background:'#FAFAFA', color:'#111827', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  btn: { width:'100%', padding:'16px', background:'#111827', color:'white', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:700, cursor:'pointer', letterSpacing:'-0.3px', marginTop:'8px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'4px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
}