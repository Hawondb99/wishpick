import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

const EVENT_TYPES_KO = ['생일', '결혼기념일', '연애기념일', '졸업', '입사/승진', '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스', '발렌타인데이', '화이트데이', '명절', '기타']
const EVENT_TYPES_EN = ['Birthday', 'Anniversary', 'Dating Anniversary', 'Graduation', 'Promotion', 'Wedding', 'Baby Shower', 'Housewarming', 'Christmas', "Valentine's Day", 'White Day', 'Holiday', 'Other']

const eventEmoji: Record<string, string> = {
  '생일': '🎂', 'Birthday': '🎂', '결혼기념일': '💑', 'Anniversary': '💑',
  '연애기념일': '💕', 'Dating Anniversary': '💕', '졸업': '🎓', 'Graduation': '🎓',
  '입사/승진': '💼', 'Promotion': '💼', '결혼': '💍', 'Wedding': '💍',
  '베이비샤워': '👶', 'Baby Shower': '👶', '돌잔치': '🎈', '집들이': '🏠',
  'Housewarming': '🏠', '크리스마스': '🎄', 'Christmas': '🎄',
  '발렌타인데이': '💝', "Valentine's Day": '💝', '화이트데이': '🤍',
  '명절': '🎆', 'Holiday': '🎆', '기타': '📅', 'Other': '📅'
}

type ProfileView = 'main' | 'edit' | 'settings' | 'received'

export default function Profile({ session, onBack, onGoNotifications, onGoMyWishes, onGoGroup }: {
  session: any
  onBack: () => void
  onGoNotifications?: () => void
  onGoMyWishes?: () => void
  onGoGroup?: (group: any) => void
}) {
  const { lang, setLang } = useLang()
  const [view, setView] = useState<ProfileView>('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 프로필 데이터
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [favoriteBrands, setFavoriteBrands] = useState('')
  const [favoriteColors, setFavoriteColors] = useState('')
  const [clothesSize, setClothesSize] = useState('')
  const [shoesSize, setShoesSize] = useState('')
  const [preferredScent, setPreferredScent] = useState('')
  const [skinType, setSkinType] = useState('')
  const [giftPreferences, setGiftPreferences] = useState('')
  const [unwantedGifts, setUnwantedGifts] = useState('')
  const [ddayAlertDays, setDdayAlertDays] = useState<number | string>(30)
  const [customDays, setCustomDays] = useState('')

  // 통계
  const [wishCount, setWishCount] = useState(0)
  const [receivedCount, setReceivedCount] = useState(0)
  const [reservedCount, setReservedCount] = useState(0)

  // 그룹
  const [groups, setGroups] = useState<any[]>([])

  // 받은 선물
  const [receivedWishes, setReceivedWishes] = useState<any[]>([])
  const [receivedTab, setReceivedTab] = useState<'tome' | 'fromme'>('tome')

  // 이벤트
  const [events, setEvents] = useState<any[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [newEventType, setNewEventType] = useState(lang === 'ko' ? '생일' : 'Birthday')
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventRepeat, setNewEventRepeat] = useState(true)
  const [customEventType, setCustomEventType] = useState('')

  const EVENT_TYPES = lang === 'ko' ? EVENT_TYPES_KO : EVENT_TYPES_EN

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    await Promise.all([fetchProfile(), fetchStats(), fetchGroups(), fetchEvents()])
    setLoading(false)
  }

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data)
      setName(data.name || '')
      setBirthday(data.birthday || '')
      setFavoriteBrands(data.favorite_brands?.join(', ') || '')
      setFavoriteColors(data.favorite_colors?.join(', ') || '')
      setClothesSize(data.clothes_size || '')
      setShoesSize(data.shoes_size || '')
      setPreferredScent(data.preferred_scent || '')
      setSkinType(data.skin_type || '')
      setGiftPreferences(data.gift_preferences || '')
      setUnwantedGifts(data.unwanted_gifts || '')
      const alertDays = data.dday_alert_days
      if (alertDays === 9999) setDdayAlertDays(9999)
      else if ([30, 60, 90].includes(alertDays)) setDdayAlertDays(alertDays)
      else if (alertDays) { setDdayAlertDays('custom'); setCustomDays(String(alertDays)) }
      else setDdayAlertDays(30)
    }
  }

  const fetchStats = async () => {
    const { data: allWishes } = await supabase.from('wishes').select('id, status').eq('user_id', session.user.id)
    if (allWishes) {
      setWishCount(allWishes.length)
      setReceivedCount(allWishes.filter(w => w.status === 'received').length)
      setReservedCount(allWishes.filter(w => w.status === 'bought').length)
    }
  }

  const fetchGroups = async () => {
    const { data } = await supabase.from('group_members').select('group_id, groups(*)').eq('user_id', session.user.id)
    if (data) setGroups(data.map((d: any) => d.groups).filter(Boolean))
  }

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('user_id', session.user.id).eq('is_group_event', false).order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  const fetchReceivedWishes = async () => {
    const { data: groupData } = await supabase.from('group_members').select('group_id').eq('user_id', session.user.id)
    if (!groupData) return
    const groupIds = groupData.map((d: any) => d.group_id)
    const { data } = await supabase.from('wishes')
      .select('*, groups(name), profiles!wishes_user_id_fkey(name)')
      .in('group_id', groupIds)
      .eq('status', 'received')
      .order('received_at', { ascending: false })
    if (data) setReceivedWishes(data)
  }

  const saveProfile = async () => {
    setSaving(true)
    const alertDays = ddayAlertDays === 'custom' ? (parseInt(customDays) || 30) : Number(ddayAlertDays)
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, email: session.user.email, name,
      birthday: birthday || null,
      favorite_brands: favoriteBrands ? favoriteBrands.split(',').map(s => s.trim()).filter(Boolean) : [],
      favorite_colors: favoriteColors ? favoriteColors.split(',').map(s => s.trim()).filter(Boolean) : [],
      clothes_size: clothesSize, shoes_size: shoesSize,
      preferred_scent: preferredScent, skin_type: skinType,
      gift_preferences: giftPreferences, unwanted_gifts: unwantedGifts,
      dday_alert_days: alertDays,
    })
    setSaving(false)
    if (!error) { await fetchProfile(); await fetchStats(); setView('main') }
    else alert('Error: ' + error.message)
  }

  const resetEventForm = () => {
    setNewEventType(lang === 'ko' ? '생일' : 'Birthday')
    setNewEventTitle(''); setNewEventDate('')
    setNewEventRepeat(true); setCustomEventType(''); setEditingEvent(null)
  }

  const addEvent = async () => {
    const eventType = (newEventType === '기타' || newEventType === 'Other') ? customEventType : newEventType
    if (!eventType) { alert(lang === 'ko' ? '이벤트 종류를 입력해주세요!' : 'Please enter event type!'); return }
    if (!newEventDate && newEventType !== '생일' && newEventType !== 'Birthday') { alert(lang === 'ko' ? '날짜를 입력해주세요!' : 'Please enter a date!'); return }
    const { error } = await supabase.from('events').insert({
      user_id: session.user.id, group_id: null,
      title: newEventTitle || eventType, event_type: eventType,
      event_date: (newEventType === '생일' || newEventType === 'Birthday') ? birthday || null : newEventDate,
      is_group_event: false,
      use_profile_birthday: newEventType === '생일' || newEventType === 'Birthday',
      is_recurring: newEventRepeat
    })
    if (!error) { fetchEvents(); setShowAddEvent(false); resetEventForm() }
  }

  const openEditEvent = (e: any) => {
    setEditingEvent(e); setNewEventType(e.event_type); setNewEventTitle(e.title)
    setNewEventDate(e.event_date || ''); setNewEventRepeat(e.is_recurring ?? true)
    setCustomEventType(''); setShowEditEvent(true)
  }

  const saveEditEvent = async () => {
    const eventType = (newEventType === '기타' || newEventType === 'Other') ? customEventType : newEventType
    if (!eventType) return
    const { error } = await supabase.from('events').update({
      title: newEventTitle || eventType, event_type: eventType,
      event_date: (newEventType === '생일' || newEventType === 'Birthday') ? birthday || null : newEventDate,
      is_recurring: newEventRepeat,
      use_profile_birthday: newEventType === '생일' || newEventType === 'Birthday'
    }).eq('id', editingEvent.id)
    if (!error) { fetchEvents(); setShowEditEvent(false); resetEventForm() }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm(lang === 'ko' ? '이벤트를 삭제할까요?' : 'Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const getDday = (dateStr: string, isRecurring: boolean) => {
    if (!dateStr) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const eventDate = new Date(dateStr)
    if (isRecurring) {
      eventDate.setFullYear(today.getFullYear())
      if (eventDate < today) eventDate.setFullYear(today.getFullYear() + 1)
    }
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return 'D-DAY'
    if (diff < 0) return lang === 'ko' ? '지남' : 'Passed'
    return `D-${diff}`
  }

  const groupTypeLabel = (type: string) => {
    if (lang === 'en') {
      const map: Record<string, string> = { '커플': 'Couple', '가족': 'Family', '친구': 'Friends', '직장': 'Work', '기타': 'Other' }
      return map[type] || type
    }
    return type
  }

  const EventFormFields = () => (
    <>
      <p style={s.inputLabel}>{lang === 'ko' ? '이벤트 종류' : 'Event Type'}</p>
      <select style={s.input} value={newEventType} onChange={e => setNewEventType(e.target.value)}>
        {EVENT_TYPES.map(type => <option key={type}>{type}</option>)}
      </select>
      {(newEventType === '기타' || newEventType === 'Other') && (
        <input style={s.input} placeholder={lang === 'ko' ? '이벤트 이름 직접 입력' : 'Enter event name'} value={customEventType} onChange={e => setCustomEventType(e.target.value)} />
      )}
      <p style={s.inputLabel}>{lang === 'ko' ? '이벤트 이름 (선택)' : 'Event Name (optional)'}</p>
      <input style={s.input} placeholder={lang === 'ko' ? `예: 내 ${newEventType}` : `e.g. My ${newEventType}`} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
      {(newEventType === '생일' || newEventType === 'Birthday') ? (
        <div style={{background:'#F5F5F5', borderRadius:'10px', padding:'12px', marginBottom:'12px', fontSize:'13px', color:'#6B7280'}}>
          🎂 {lang === 'ko' ? '프로필에 저장된 생일 날짜가 자동으로 연동돼요!' : 'Auto-linked to your profile birthday!'}
        </div>
      ) : (
        <>
          <p style={s.inputLabel}>{lang === 'ko' ? '이벤트 날짜' : 'Event Date'}</p>
          <input style={s.input} type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
        </>
      )}
      <p style={s.inputLabel}>{lang === 'ko' ? '반복 설정' : 'Repeat'}</p>
      <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
        {[
          { value: true,  label: lang === 'ko' ? '🔄 매년 반복' : '🔄 Yearly',   desc: lang === 'ko' ? '생일, 기념일 등' : 'Birthday, anniversary' },
          { value: false, label: lang === 'ko' ? '1️⃣ 일회성' : '1️⃣ One-time', desc: lang === 'ko' ? '결혼식, 졸업 등' : 'Wedding, graduation' },
        ].map(opt => (
          <div key={String(opt.value)} onClick={() => setNewEventRepeat(opt.value)} style={{
            flex:1, padding:'10px', borderRadius:'12px', cursor:'pointer', textAlign:'center',
            border:`1.5px solid ${newEventRepeat === opt.value ? '#111827' : '#F0F0F0'}`,
            background: newEventRepeat === opt.value ? '#111827' : 'white'
          }}>
            <p style={{fontSize:'13px', fontWeight:600, color: newEventRepeat === opt.value ? 'white' : '#374151', margin:0}}>{opt.label}</p>
            <p style={{fontSize:'11px', color: newEventRepeat === opt.value ? 'rgba(255,255,255,0.6)' : '#9CA3AF', margin:'2px 0 0'}}>{opt.desc}</p>
          </div>
        ))}
      </div>
    </>
  )

  if (loading) return <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'32px'}}>🎁</div>

  // ── 메인 마이페이지 ──
  if (view === 'main') return (
    <div style={s.container}>
      <div style={s.header}>
        <p style={s.headerTitle}>{lang === 'ko' ? '마이페이지' : 'My Page'}</p>
        <button style={s.logoutIconBtn} onClick={() => supabase.auth.signOut()}>⏻</button>
      </div>

      <div style={s.scroll}>
        {/* 프로필 카드 */}
        <div style={s.profileCard}>
          <div style={s.avatar}>
            <span style={{fontSize:'32px'}}>👤</span>
          </div>
          <div style={{flex:1}}>
            <p style={s.profileName}>{profile?.name || (lang === 'ko' ? '이름 없음' : 'No name')}</p>
            <p style={s.profileEmail}>{session.user.email}</p>
          </div>
          <button style={s.editProfileBtn} onClick={() => setView('edit')}>
            {lang === 'ko' ? '편집' : 'Edit'}
          </button>
        </div>

        {/* 통계 */}
        <div style={s.statsRow}>
          <div style={s.statBox} onClick={() => onGoMyWishes?.()}>
            <p style={s.statNum}>{wishCount}</p>
            <p style={s.statLabel}>{lang === 'ko' ? '위시' : 'Wishes'}</p>
          </div>
          <div style={s.statDivider} />
          <div style={s.statBox} onClick={() => { setView('received'); fetchReceivedWishes() }}>
            <p style={s.statNum}>{receivedCount}</p>
            <p style={s.statLabel}>{lang === 'ko' ? '받은 선물' : 'Received'}</p>
          </div>
          <div style={s.statDivider} />
          <div style={s.statBox}>
            <p style={s.statNum}>{reservedCount}</p>
            <p style={s.statLabel}>{lang === 'ko' ? '예약 중' : 'Reserved'}</p>
          </div>
        </div>

        {/* 메뉴 */}
        <div style={s.menuSection}>
          {[
            { icon: '👥', label: lang === 'ko' ? '내 그룹' : 'My Groups', action: () => {} },
            { icon: '🎁', label: lang === 'ko' ? '내 위시리스트' : 'My Wishlist', action: () => onGoMyWishes?.() },
            { icon: '🎀', label: lang === 'ko' ? '받은 선물' : 'Received Gifts', action: () => { setView('received'); fetchReceivedWishes() } },
            { icon: '⚙️', label: lang === 'ko' ? '설정' : 'Settings', action: () => setView('settings') },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              ...s.menuItem,
              borderBottom: i < arr.length - 1 ? '1px solid #F5F5F5' : 'none'
            }} onClick={item.action}>
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <div style={s.menuIconBox}>{item.icon}</div>
                <span style={s.menuLabel}>{item.label}</span>
              </div>
              <span style={s.menuArrow}>›</span>
            </div>
          ))}
        </div>

        {/* 내 이벤트 */}
        <div style={s.menuSection}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 8px'}}>
            <p style={{fontSize:'15px', fontWeight:700, color:'#111827', margin:0}}>
              {lang === 'ko' ? '내 이벤트' : 'My Events'}
            </p>
            <button style={s.addEventBtn} onClick={() => { resetEventForm(); setShowAddEvent(true) }}>
              {lang === 'ko' ? '+ 추가' : '+ Add'}
            </button>
          </div>
          {events.length === 0 ? (
            <div style={{padding:'16px', textAlign:'center', color:'#9CA3AF', fontSize:'13px'}}>
              {lang === 'ko' ? '이벤트를 추가해보세요!' : 'Add your events!'}
            </div>
          ) : events.map((e, i) => {
            const dday = getDday(e.event_date, e.is_recurring)
            return (
              <div key={e.id} style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
                borderTop: i === 0 ? '1px solid #F5F5F5' : 'none',
                borderBottom: '1px solid #F5F5F5'
              }}>
                <span style={{fontSize:'22px'}}>{eventEmoji[e.event_type] || '📅'}</span>
                <div style={{flex:1}}>
                  <p style={{fontSize:'14px', fontWeight:600, color:'#111827', margin:'0 0 2px'}}>{e.title}</p>
                  <p style={{fontSize:'12px', color:'#9CA3AF', margin:0}}>
                    {e.use_profile_birthday ? (lang === 'ko' ? '생일 자동 연동' : 'Linked to birthday') : e.event_date}
                    {' · '}{e.is_recurring ? (lang === 'ko' ? '매년' : 'Yearly') : (lang === 'ko' ? '일회성' : 'One-time')}
                  </p>
                </div>
                {dday && (
                  <span style={{
                    fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'50px',
                    background: dday === 'D-DAY' ? '#111827' : '#F5F5F5',
                    color: dday === 'D-DAY' ? 'white' : '#374151'
                  }}>{dday}</span>
                )}
                <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'4px'}} onClick={() => openEditEvent(e)}>✏️</button>
                <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'#9CA3AF', padding:'4px'}} onClick={() => deleteEvent(e.id)}>🗑️</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 이벤트 추가 모달 */}
      {showAddEvent && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowAddEvent(false); resetEventForm() } }}>
          <div style={{...s.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={s.handle} />
            <p style={s.modalTitle}>{lang === 'ko' ? '📅 이벤트 추가' : '📅 Add Event'}</p>
            <EventFormFields />
            <button style={s.btn} onClick={addEvent}>{lang === 'ko' ? '추가하기' : 'Add'}</button>
            <button style={s.cancelBtn} onClick={() => { setShowAddEvent(false); resetEventForm() }}>{lang === 'ko' ? '취소' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {/* 이벤트 수정 모달 */}
      {showEditEvent && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowEditEvent(false); resetEventForm() } }}>
          <div style={{...s.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={s.handle} />
            <p style={s.modalTitle}>{lang === 'ko' ? '✏️ 이벤트 수정' : '✏️ Edit Event'}</p>
            <EventFormFields />
            <button style={s.btn} onClick={saveEditEvent}>{lang === 'ko' ? '저장하기' : 'Save'}</button>
            <button style={s.cancelBtn} onClick={() => { setShowEditEvent(false); resetEventForm() }}>{lang === 'ko' ? '취소' : 'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  )

  // ── 프로필 편집 ──
  if (view === 'edit') return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setView('main')}>←</button>
        <p style={s.headerTitle}>{lang === 'ko' ? '프로필 편집' : 'Edit Profile'}</p>
        <button style={s.saveTopBtn} onClick={saveProfile} disabled={saving}>
          {saving ? (lang === 'ko' ? '저장 중' : 'Saving') : (lang === 'ko' ? '저장' : 'Save')}
        </button>
      </div>
      <div style={{padding:'20px 20px 100px'}}>
        <p style={s.inputLabel}>{lang === 'ko' ? '이름' : 'Name'}</p>
        <input style={s.input} placeholder={lang === 'ko' ? '이름을 입력해주세요' : 'Enter your name'} value={name} onChange={e => setName(e.target.value)} />
        <p style={s.inputLabel}>{lang === 'ko' ? '생일' : 'Birthday'}</p>
        <input style={s.input} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        <p style={{fontSize:'12px', color:'#9CA3AF', margin:'-8px 0 16px'}}>
          {lang === 'ko' ? '생일을 저장하면 그룹 멤버들에게 D-day 알림이 가요' : 'Members will get D-day alerts for your birthday'}
        </p>

        <p style={s.sectionDivider}>{lang === 'ko' ? '💝 취향 정보' : '💝 Preferences'}</p>
        <p style={s.inputLabel}>{lang === 'ko' ? '좋아하는 브랜드' : 'Favorite Brands'}</p>
        <input style={s.input} placeholder={lang === 'ko' ? '예: 조말론, 애플 (쉼표로 구분)' : 'e.g. Jo Malone, Apple'} value={favoriteBrands} onChange={e => setFavoriteBrands(e.target.value)} />
        <p style={s.inputLabel}>{lang === 'ko' ? '좋아하는 색상' : 'Favorite Colors'}</p>
        <input style={s.input} placeholder={lang === 'ko' ? '예: 아이보리, 연핑크' : 'e.g. Ivory, Blush'} value={favoriteColors} onChange={e => setFavoriteColors(e.target.value)} />
        <p style={s.inputLabel}>{lang === 'ko' ? '선호하는 향' : 'Preferred Scent'}</p>
        <input style={s.input} placeholder={lang === 'ko' ? '예: 은은한 플로럴' : 'e.g. Light floral'} value={preferredScent} onChange={e => setPreferredScent(e.target.value)} />
        <p style={s.inputLabel}>{lang === 'ko' ? '피부 타입' : 'Skin Type'}</p>
        <select style={s.input} value={skinType} onChange={e => setSkinType(e.target.value)}>
          {(lang === 'ko'
            ? ['선택 안함', '건성', '지성', '복합성', '민감성', '중성']
            : ['Not specified', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Normal']
          ).map(st => <option key={st} value={st === (lang === 'ko' ? '선택 안함' : 'Not specified') ? '' : st}>{st}</option>)}
        </select>

        <p style={s.sectionDivider}>{lang === 'ko' ? '📏 사이즈' : '📏 Size'}</p>
        <div style={{display:'flex', gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={s.inputLabel}>{lang === 'ko' ? '옷 사이즈' : 'Clothes Size'}</p>
            <select style={s.input} value={clothesSize} onChange={e => setClothesSize(e.target.value)}>
              <option value="">-</option>
              {['XS','S','M','L','XL','XXL'].map(sz => <option key={sz}>{sz}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <p style={s.inputLabel}>{lang === 'ko' ? '신발 사이즈' : 'Shoes Size'}</p>
            <input style={s.input} placeholder={lang === 'ko' ? '예: 240' : 'e.g. 9'} value={shoesSize} onChange={e => setShoesSize(e.target.value)} />
          </div>
        </div>

        <p style={s.sectionDivider}>{lang === 'ko' ? '🎁 선물 취향' : '🎁 Gift Preferences'}</p>
        <p style={s.inputLabel}>{lang === 'ko' ? '이런 선물을 좋아해요' : 'Gifts I love'}</p>
        <textarea style={{...s.input, minHeight:'80px', resize:'vertical'}} placeholder={lang === 'ko' ? '예: 실용적인 선물을 좋아해요.' : 'e.g. I love practical gifts.'} value={giftPreferences} onChange={e => setGiftPreferences(e.target.value)} />
        <p style={s.inputLabel}>{lang === 'ko' ? '이런 선물은 받고 싶지 않아요' : "Gifts I'd rather not receive"}</p>
        <textarea style={{...s.input, minHeight:'80px', resize:'vertical'}} placeholder={lang === 'ko' ? '예: 향초는 이미 많아요.' : 'e.g. I already have too many candles.'} value={unwantedGifts} onChange={e => setUnwantedGifts(e.target.value)} />

        <p style={s.sectionDivider}>{lang === 'ko' ? '🔔 D-day 알림' : '🔔 D-day Alerts'}</p>
        <p style={{fontSize:'13px', color:'#9CA3AF', margin:'-4px 0 14px'}}>
          {lang === 'ko' ? '얼마 전부터 이벤트 알림 카드를 보여줄까요?' : 'How early should D-day alerts appear?'}
        </p>
        {[
          { value: 30,      label: 'D-30', desc: lang === 'ko' ? '1개월 전부터' : '1 month before' },
          { value: 60,      label: 'D-60', desc: lang === 'ko' ? '2개월 전부터' : '2 months before' },
          { value: 90,      label: 'D-90', desc: lang === 'ko' ? '3개월 전부터' : '3 months before' },
          { value: 9999,    label: lang === 'ko' ? '항상 표시' : 'Always', desc: lang === 'ko' ? '모든 이벤트 항상 보기' : 'Always show all' },
          { value: 'custom', label: lang === 'ko' ? '직접 설정' : 'Custom', desc: lang === 'ko' ? '원하는 기간 입력' : 'Enter custom days' },
        ].map(opt => (
          <div key={String(opt.value)} onClick={() => setDdayAlertDays(opt.value as any)} style={{
            padding:'12px 14px', marginBottom:'8px', borderRadius:'12px', cursor:'pointer',
            border:`1.5px solid ${ddayAlertDays === opt.value ? '#111827' : '#F0F0F0'}`,
            background: ddayAlertDays === opt.value ? '#111827' : 'white',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <div>
              <span style={{fontSize:'14px', fontWeight:600, color: ddayAlertDays === opt.value ? 'white' : '#374151'}}>{opt.label}</span>
              <span style={{fontSize:'12px', color: ddayAlertDays === opt.value ? 'rgba(255,255,255,0.6)' : '#9CA3AF', marginLeft:'8px'}}>{opt.desc}</span>
            </div>
            {ddayAlertDays === opt.value && <span style={{color:'white'}}>✓</span>}
          </div>
        ))}
        {ddayAlertDays === 'custom' && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
            <input style={{...s.input, marginBottom:0, flex:1}} type="number" placeholder="45" value={customDays} onChange={e => setCustomDays(e.target.value)} />
            <span style={{fontSize:'13px', color:'#6B7280', flexShrink:0}}>{lang === 'ko' ? '일 전부터' : 'days before'}</span>
          </div>
        )}

        <button style={s.btn} onClick={saveProfile} disabled={saving}>
          {saving ? (lang === 'ko' ? '저장 중...' : 'Saving...') : (lang === 'ko' ? '💾 프로필 저장하기' : '💾 Save Profile')}
        </button>
      </div>
    </div>
  )

  // ── 설정 ──
  if (view === 'settings') return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setView('main')}>←</button>
        <p style={s.headerTitle}>{lang === 'ko' ? '설정' : 'Settings'}</p>
        <div style={{width:'32px'}} />
      </div>
      <div style={{padding:'20px 20px 100px'}}>

        {/* 언어 */}
        <p style={s.settingGroupLabel}>{lang === 'ko' ? '언어' : 'Language'}</p>
        <div style={s.menuSection}>
          <div style={{display:'flex', gap:'10px', padding:'14px 16px'}}>
            {[{ value:'ko', label:'한국어' }, { value:'en', label:'English' }].map(opt => (
              <div key={opt.value} onClick={() => setLang(opt.value as 'ko'|'en')} style={{
                flex:1, padding:'12px', borderRadius:'12px', cursor:'pointer', textAlign:'center',
                border:`1.5px solid ${lang === opt.value ? '#111827' : '#F0F0F0'}`,
                background: lang === opt.value ? '#111827' : 'white'
              }}>
                <p style={{fontSize:'14px', fontWeight:600, color: lang === opt.value ? 'white' : '#374151', margin:0}}>{opt.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 계정 */}
        <p style={s.settingGroupLabel}>{lang === 'ko' ? '계정' : 'Account'}</p>
        <div style={s.menuSection}>
          <div style={{...s.menuItem, borderBottom:'1px solid #F5F5F5'}} onClick={() => setView('edit')}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div style={s.menuIconBox}>👤</div>
              <span style={s.menuLabel}>{lang === 'ko' ? '프로필 편집' : 'Edit Profile'}</span>
            </div>
            <span style={s.menuArrow}>›</span>
          </div>
          <div style={s.menuItem} onClick={() => onGoNotifications?.()}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div style={s.menuIconBox}>🔔</div>
              <span style={s.menuLabel}>{lang === 'ko' ? '알림 설정' : 'Notification Settings'}</span>
            </div>
            <span style={s.menuArrow}>›</span>
          </div>
        </div>

        {/* 앱 정보 */}
        <p style={s.settingGroupLabel}>{lang === 'ko' ? '앱 정보' : 'App Info'}</p>
        <div style={s.menuSection}>
          <div style={{...s.menuItem, borderBottom:'1px solid #F5F5F5'}}>
            <span style={{fontSize:'14px', color:'#6B7280'}}>{lang === 'ko' ? '버전' : 'Version'}</span>
            <span style={{fontSize:'14px', color:'#111827', fontWeight:600}}>1.0.0</span>
          </div>
          <div style={s.menuItem}>
            <span style={{fontSize:'14px', color:'#6B7280'}}>{lang === 'ko' ? '만든 곳' : 'Made by'}</span>
            <span style={{fontSize:'14px', color:'#111827', fontWeight:600}}>WishPick Team</span>
          </div>
        </div>

        {/* 로그아웃 */}
        <button style={s.logoutBtn} onClick={() => supabase.auth.signOut()}>
          {lang === 'ko' ? '로그아웃' : 'Sign Out'}
        </button>
      </div>
    </div>
  )

  // ── 받은 선물 ──
  if (view === 'received') return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setView('main')}>←</button>
        <p style={s.headerTitle}>{lang === 'ko' ? '받은 선물' : 'Received Gifts'}</p>
        <div style={{width:'32px'}} />
      </div>

      {/* 탭 */}
      <div style={s.tabRow}>
        <button style={{
          ...s.tabBtn,
          borderBottom: receivedTab === 'tome' ? '2px solid #111827' : '2px solid transparent',
          color: receivedTab === 'tome' ? '#111827' : '#9CA3AF',
          fontWeight: receivedTab === 'tome' ? 700 : 400,
        }} onClick={() => setReceivedTab('tome')}>
          {lang === 'ko' ? '나에게 받은 것' : 'Received by me'}
          <span style={{marginLeft:'6px', fontSize:'12px', color: receivedTab === 'tome' ? '#111827' : '#9CA3AF'}}>
            {receivedWishes.filter(w => w.user_id === session.user.id).length}
          </span>
        </button>
        <button style={{
          ...s.tabBtn,
          borderBottom: receivedTab === 'fromme' ? '2px solid #111827' : '2px solid transparent',
          color: receivedTab === 'fromme' ? '#111827' : '#9CA3AF',
          fontWeight: receivedTab === 'fromme' ? 700 : 400,
        }} onClick={() => setReceivedTab('fromme')}>
          {lang === 'ko' ? '내가 준 것' : 'Given by me'}
          <span style={{marginLeft:'6px', fontSize:'12px', color: receivedTab === 'fromme' ? '#111827' : '#9CA3AF'}}>
            {receivedWishes.filter(w => w.bought_by === session.user.id).length}
          </span>
        </button>
      </div>

      <div style={{paddingBottom:'40px'}}>
        {receivedWishes
          .filter(w => receivedTab === 'tome' ? w.user_id === session.user.id : w.bought_by === session.user.id)
          .map((w, i, arr) => (
            <div key={w.id} style={{
              display:'flex', gap:'14px', padding:'16px 20px', alignItems:'flex-start',
              borderBottom: i < arr.length - 1 ? '1px solid #F5F5F5' : 'none'
            }}>
              <div style={{width:'64px', height:'64px', background:'#F5F5F5', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0}}>
                {w.image_url
                  ? <img src={w.image_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px'}} onError={e => { e.currentTarget.style.display='none' }} />
                  : <span style={{fontSize:'24px'}}>🎁</span>
                }
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:'14px', fontWeight:600, color:'#111827', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{w.name}</p>
                <p style={{fontSize:'13px', fontWeight:700, color:'#111827', margin:'0 0 2px'}}>
                  {w.price ? `₩${w.price.toLocaleString()}` : (lang === 'ko' ? '가격 미정' : 'No price')}
                </p>
                <p style={{fontSize:'12px', color:'#9CA3AF', margin:'0 0 4px'}}>
                  {w.groups?.name}
                  {w.received_at && ` · ${new Date(w.received_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year:'numeric', month:'short', day:'numeric' })}`}
                </p>
                {w.thanks_message && (
                  <div style={{background:'#F9F9F9', borderRadius:'8px', padding:'7px 10px', display:'flex', gap:'6px', alignItems:'flex-start'}}>
                    <span style={{fontSize:'14px'}}>{w.thanks_emoji || '💝'}</span>
                    <p style={{fontSize:'12px', color:'#6B7280', margin:0, lineHeight:1.4}}>{w.thanks_message}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        {receivedWishes.filter(w => receivedTab === 'tome' ? w.user_id === session.user.id : w.bought_by === session.user.id).length === 0 && (
          <div style={{textAlign:'center', padding:'80px 24px'}}>
            <p style={{fontSize:'44px', margin:'0 0 14px'}}>🎀</p>
            <p style={{fontSize:'16px', fontWeight:700, color:'#111827', margin:'0 0 6px'}}>
              {lang === 'ko' ? '아직 없어요' : 'Nothing here yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return null
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'54px 20px 14px', background:'#fff', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#111827', padding:'4px', lineHeight:1 },
  headerTitle: { fontSize:'20px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' },
  saveTopBtn: { background:'#111827', color:'white', border:'none', borderRadius:'50px', padding:'8px 18px', fontSize:'13px', fontWeight:600, cursor:'pointer' },
  logoutIconBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9CA3AF', padding:'4px' },
  scroll: { paddingBottom:'100px' },
  profileCard: { display:'flex', alignItems:'center', gap:'14px', padding:'20px 20px 16px' },
  avatar: { width:'60px', height:'60px', borderRadius:'50%', background:'#F5F5F5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  profileName: { fontSize:'18px', fontWeight:800, color:'#111827', margin:'0 0 3px', letterSpacing:'-0.4px' },
  profileEmail: { fontSize:'13px', color:'#9CA3AF', margin:0 },
  editProfileBtn: { background:'#F5F5F5', border:'none', borderRadius:'50px', padding:'8px 16px', fontSize:'13px', fontWeight:600, color:'#374151', cursor:'pointer' },
  statsRow: { display:'flex', padding:'16px 20px 20px', borderBottom:'1px solid #F5F5F5', borderTop:'1px solid #F5F5F5' },
  statBox: { flex:1, textAlign:'center', cursor:'pointer' },
  statNum: { fontSize:'22px', fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-0.5px' },
  statLabel: { fontSize:'11px', color:'#9CA3AF', margin:0, fontWeight:500 },
  statDivider: { width:'1px', background:'#F0F0F0', margin:'0 4px' },
  menuSection: { background:'white', border:'1px solid #F5F5F5', borderRadius:'16px', margin:'16px 20px 0', overflow:'hidden' },
  menuItem: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', cursor:'pointer' },
  menuIconBox: { width:'36px', height:'36px', borderRadius:'10px', background:'#F5F5F5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 },
  menuLabel: { fontSize:'15px', color:'#111827', fontWeight:500 },
  menuArrow: { fontSize:'18px', color:'#D1D5DB' },
  addEventBtn: { background:'#111827', color:'white', border:'none', borderRadius:'50px', padding:'6px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' },
  settingGroupLabel: { fontSize:'12px', fontWeight:600, color:'#9CA3AF', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.5px' },
  logoutBtn: { width:'100%', padding:'16px', background:'white', border:'1.5px solid #FECACA', borderRadius:'14px', fontSize:'15px', fontWeight:600, cursor:'pointer', color:'#EF4444', marginTop:'24px' },
  tabRow: { display:'flex', borderBottom:'1px solid #F3F4F6', padding:'0 20px' },
  tabBtn: { flex:1, padding:'14px 0', background:'none', border:'none', borderRadius:0, cursor:'pointer', fontSize:'14px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 44px' },
  handle: { width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 24px' },
  modalTitle: { fontSize:'22px', fontWeight:800, color:'#111827', margin:'0 0 24px', letterSpacing:'-0.5px' },
  inputLabel: { fontSize:'12px', fontWeight:600, color:'#9CA3AF', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.5px' },
  sectionDivider: { fontSize:'15px', fontWeight:700, color:'#111827', margin:'8px 0 16px', paddingTop:'16px', borderTop:'1px solid #F5F5F5' },
  input: { width:'100%', padding:'14px 16px', marginBottom:'12px', border:'1.5px solid #F0F0F0', borderRadius:'12px', fontSize:'15px', outline:'none', boxSizing:'border-box', background:'#FAFAFA', color:'#111827', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  btn: { width:'100%', padding:'16px', background:'#111827', color:'white', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:700, cursor:'pointer', letterSpacing:'-0.3px', marginTop:'8px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'4px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
}