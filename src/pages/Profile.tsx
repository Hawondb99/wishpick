import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EVENT_TYPES = [
  '생일', '결혼기념일', '연애기념일', '졸업', '입사/승진',
  '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스',
  '발렌타인데이', '화이트데이', '명절', '기타'
]

const eventEmoji: Record<string, string> = {
  '생일': '🎂', '결혼기념일': '💑', '연애기념일': '💕', '졸업': '🎓',
  '입사/승진': '💼', '결혼': '💍', '베이비샤워': '👶', '돌잔치': '🎈',
  '집들이': '🏠', '크리스마스': '🎄', '발렌타인데이': '💝', '화이트데이': '🤍',
  '명절': '🎆', '기타': '📅'
}

export default function Profile({ session, onBack }: { session: any, onBack: () => void }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const [events, setEvents] = useState<any[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [newEventType, setNewEventType] = useState('생일')
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventRepeat, setNewEventRepeat] = useState(true)
  const [customEventType, setCustomEventType] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchEvents()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) {
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
    setLoading(false)
  }

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_group_event', false)
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  const saveProfile = async () => {
    setSaving(true)
    const alertDays = ddayAlertDays === 'custom' ? (parseInt(customDays) || 30) : Number(ddayAlertDays)
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      name,
      birthday: birthday || null,
      favorite_brands: favoriteBrands ? favoriteBrands.split(',').map(s => s.trim()).filter(Boolean) : [],
      favorite_colors: favoriteColors ? favoriteColors.split(',').map(s => s.trim()).filter(Boolean) : [],
      clothes_size: clothesSize,
      shoes_size: shoesSize,
      preferred_scent: preferredScent,
      skin_type: skinType,
      gift_preferences: giftPreferences,
      unwanted_gifts: unwantedGifts,
      dday_alert_days: alertDays,
    })
    setSaving(false)
    if (!error) { alert('✅ 프로필이 저장됐어요!'); onBack() }
    else alert('오류: ' + error.message)
  }

  const resetEventForm = () => {
    setNewEventType('생일'); setNewEventTitle(''); setNewEventDate('')
    setNewEventRepeat(true); setCustomEventType(''); setEditingEvent(null)
  }

  const addEvent = async () => {
    const eventType = newEventType === '기타' ? customEventType : newEventType
    if (!eventType) { alert('이벤트 종류를 입력해주세요!'); return }
    if (!newEventDate && newEventType !== '생일') { alert('날짜를 입력해주세요!'); return }
    const { error } = await supabase.from('events').insert({
      user_id: session.user.id, group_id: null,
      title: newEventTitle || eventType, event_type: eventType,
      event_date: newEventType === '생일' ? birthday || null : newEventDate,
      is_group_event: false, use_profile_birthday: newEventType === '생일',
      is_recurring: newEventRepeat
    })
    if (!error) { fetchEvents(); setShowAddEvent(false); resetEventForm() }
    else alert('오류: ' + error.message)
  }

  const openEditEvent = (e: any) => {
    setEditingEvent(e); setNewEventType(e.event_type); setNewEventTitle(e.title)
    setNewEventDate(e.event_date || ''); setNewEventRepeat(e.is_recurring ?? true)
    setCustomEventType(''); setShowEditEvent(true)
  }

  const saveEditEvent = async () => {
    const eventType = newEventType === '기타' ? customEventType : newEventType
    if (!eventType) { alert('이벤트 종류를 입력해주세요!'); return }
    const { error } = await supabase.from('events').update({
      title: newEventTitle || eventType, event_type: eventType,
      event_date: newEventType === '생일' ? birthday || null : newEventDate,
      is_recurring: newEventRepeat, use_profile_birthday: newEventType === '생일'
    }).eq('id', editingEvent.id)
    if (!error) { fetchEvents(); setShowEditEvent(false); resetEventForm() }
    else alert('수정 오류: ' + error.message)
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('이벤트를 삭제할까요?')) return
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
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'D-DAY'
    if (diff < 0) return '지남'
    return `D-${diff}`
  }

  const EventFormFields = () => (
    <>
      <label style={styles.label}>이벤트 종류</label>
      <select style={styles.input} value={newEventType} onChange={e => setNewEventType(e.target.value)}>
        {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      {newEventType === '기타' && (
        <input style={styles.input} placeholder="이벤트 이름 직접 입력" value={customEventType} onChange={e => setCustomEventType(e.target.value)} />
      )}
      <label style={styles.label}>이벤트 이름 (선택)</label>
      <input style={styles.input} placeholder={`예: 내 ${newEventType}`} value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
      {newEventType === '생일' ? (
        <div style={{background:'#FDF2F8', borderRadius:'10px', padding:'12px', marginBottom:'12px', fontSize:'13px', color:'#F472B6'}}>
          🎂 프로필에 저장된 생일 날짜가 자동으로 연동돼요!
        </div>
      ) : (
        <>
          <label style={styles.label}>이벤트 날짜</label>
          <input style={styles.input} type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
        </>
      )}
      <label style={styles.label}>반복 설정</label>
      <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
        {[
          { value: true, label: '🔄 매년 반복', desc: '생일, 기념일 등' },
          { value: false, label: '1️⃣ 일회성', desc: '결혼식, 졸업 등' }
        ].map(opt => (
          <div key={String(opt.value)} onClick={() => setNewEventRepeat(opt.value)} style={{
            flex:1, padding:'10px', borderRadius:'10px', cursor:'pointer', textAlign:'center',
            border:`1.5px solid ${newEventRepeat === opt.value ? '#F472B6' : '#E5E7EB'}`,
            background: newEventRepeat === opt.value ? '#FDF2F8' : 'white'
          }}>
            <div style={{fontSize:'13px', fontWeight:600, color: newEventRepeat === opt.value ? '#F472B6' : '#374151'}}>{opt.label}</div>
            <div style={{fontSize:'11px', color:'#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
          </div>
        ))}
      </div>
    </>
  )

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'32px'}}>🎁</div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px'}}>프로필 설정</div>
        <button style={styles.saveBtn} onClick={saveProfile} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div style={styles.content}>
        {/* 기본 정보 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👤 기본 정보</div>
          <div style={styles.field}>
            <label style={styles.label}>이름</label>
            <input style={styles.input} placeholder="이름을 입력해주세요" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>생일 🎂</label>
            <input style={styles.input} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
            <div style={styles.hint}>생일을 저장하면 그룹 멤버들에게 D-day 알림이 가요</div>
          </div>
        </div>

        {/* D-day 알림 설정 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🔔 D-day 알림 설정</div>
          <div style={styles.hint}>얼마 전부터 이벤트 알림 카드를 보여줄까요?</div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px'}}>
            {[
              { value: 30, label: 'D-30', desc: '1개월 전부터' },
              { value: 60, label: 'D-60', desc: '2개월 전부터' },
              { value: 90, label: 'D-90', desc: '3개월 전부터' },
              { value: 9999, label: '항상 표시', desc: '모든 이벤트 항상 보기' },
              { value: 'custom', label: '직접 설정', desc: '원하는 기간 입력' },
            ].map(opt => (
              <div key={String(opt.value)} onClick={() => setDdayAlertDays(opt.value as any)} style={{
                padding:'12px 14px', borderRadius:'12px', cursor:'pointer',
                border:`1.5px solid ${ddayAlertDays === opt.value ? '#F472B6' : '#E5E7EB'}`,
                background: ddayAlertDays === opt.value ? '#FDF2F8' : 'white',
                display:'flex', alignItems:'center', justifyContent:'space-between'
              }}>
                <div>
                  <span style={{fontSize:'14px', fontWeight:600, color: ddayAlertDays === opt.value ? '#F472B6' : '#374151'}}>{opt.label}</span>
                  <span style={{fontSize:'12px', color:'#9CA3AF', marginLeft:'8px'}}>{opt.desc}</span>
                </div>
                {ddayAlertDays === opt.value && <span style={{color:'#F472B6'}}>✅</span>}
              </div>
            ))}
            {ddayAlertDays === 'custom' && (
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'4px', padding:'0 4px'}}>
                <input
                  style={{...styles.input, marginBottom:0, flex:1}}
                  type="number" placeholder="예: 45"
                  value={customDays} onChange={e => setCustomDays(e.target.value)}
                />
                <span style={{fontSize:'13px', color:'#6B7280', flexShrink:0}}>일 전부터</span>
              </div>
            )}
          </div>
        </div>

        {/* 내 이벤트 */}
        <div style={styles.section}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px'}}>
            <div style={styles.sectionTitle}>📅 내 이벤트</div>
            <button style={styles.addEventBtn} onClick={() => { resetEventForm(); setShowAddEvent(true) }}>+ 추가</button>
          </div>
          {events.length === 0 ? (
            <div style={{textAlign:'center', padding:'20px', color:'#9CA3AF', fontSize:'13px'}}>
              아직 이벤트가 없어요<br/>이벤트를 추가하면 그룹 멤버들에게 알림이 가요!
            </div>
          ) : events.map(e => {
            const dday = getDday(e.event_date, e.is_recurring)
            return (
              <div key={e.id} style={styles.eventCard}>
                <div style={{fontSize:'24px'}}>{eventEmoji[e.event_type] || '📅'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, fontSize:'14px'}}>{e.title}</div>
                  <div style={{fontSize:'12px', color:'#6B7280', marginTop:'2px', display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'}}>
                    <span>{e.use_profile_birthday ? '프로필 생일 자동 연동' : e.event_date}</span>
                    <span style={{background: e.is_recurring ? '#EDE9FE' : '#F3F4F6', color: e.is_recurring ? '#A78BFA' : '#6B7280', padding:'1px 6px', borderRadius:'50px', fontSize:'10px'}}>
                      {e.is_recurring ? '🔄 매년' : '1️⃣ 일회성'}
                    </span>
                  </div>
                </div>
                {dday && (
                  <div style={{
                    background: dday === 'D-DAY' ? '#F472B6' : dday === '지남' ? '#F3F4F6' : '#EDE9FE',
                    color: dday === 'D-DAY' ? 'white' : dday === '지남' ? '#9CA3AF' : '#A78BFA',
                    padding:'4px 10px', borderRadius:'50px', fontSize:'12px', fontWeight:700, flexShrink:0
                  }}>{dday}</div>
                )}
                <button style={{...styles.delEventBtn, color:'#A78BFA', marginRight:'2px'}} onClick={() => openEditEvent(e)}>✏️</button>
                <button style={styles.delEventBtn} onClick={() => deleteEvent(e.id)}>🗑️</button>
              </div>
            )
          })}
        </div>

        {/* 취향 정보 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💝 취향 정보</div>
          <div style={styles.field}>
            <label style={styles.label}>좋아하는 브랜드</label>
            <input style={styles.input} placeholder="예: 조말론, 애플, 무신사 (쉼표로 구분)" value={favoriteBrands} onChange={e => setFavoriteBrands(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>좋아하는 색상</label>
            <input style={styles.input} placeholder="예: 아이보리, 연핑크 (쉼표로 구분)" value={favoriteColors} onChange={e => setFavoriteColors(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>선호하는 향</label>
            <input style={styles.input} placeholder="예: 은은한 플로럴, 시트러스" value={preferredScent} onChange={e => setPreferredScent(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>피부 타입</label>
            <select style={styles.input} value={skinType} onChange={e => setSkinType(e.target.value)}>
              <option value="">선택 안함</option>
              <option>건성</option><option>지성</option><option>복합성</option>
              <option>민감성</option><option>중성</option>
            </select>
          </div>
        </div>

        {/* 사이즈 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📏 사이즈 정보</div>
          <div style={styles.fieldRow}>
            <div style={{...styles.field, flex:1}}>
              <label style={styles.label}>옷 사이즈</label>
              <select style={styles.input} value={clothesSize} onChange={e => setClothesSize(e.target.value)}>
                <option value="">선택</option>
                <option>XS</option><option>S</option><option>M</option>
                <option>L</option><option>XL</option><option>XXL</option>
              </select>
            </div>
            <div style={{...styles.field, flex:1}}>
              <label style={styles.label}>신발 사이즈</label>
              <input style={styles.input} placeholder="예: 240" value={shoesSize} onChange={e => setShoesSize(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 선물 취향 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎁 선물 취향</div>
          <div style={styles.field}>
            <label style={styles.label}>이런 선물을 좋아해요</label>
            <textarea style={{...styles.input, minHeight:'80px', resize:'vertical'}} placeholder="예: 실용적인 선물을 좋아해요." value={giftPreferences} onChange={e => setGiftPreferences(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>이런 선물은 받고 싶지 않아요 🚫</label>
            <textarea style={{...styles.input, minHeight:'80px', resize:'vertical'}} placeholder="예: 향초는 이미 많아요." value={unwantedGifts} onChange={e => setUnwantedGifts(e.target.value)} />
          </div>
        </div>

        <button style={styles.saveFullBtn} onClick={saveProfile} disabled={saving}>
          {saving ? '저장 중...' : '💾 프로필 저장하기'}
        </button>
      </div>

      {/* 이벤트 추가 모달 */}
      {showAddEvent && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowAddEvent(false); resetEventForm() } }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>📅 이벤트 추가</div>
            <EventFormFields />
            <button style={styles.btn} onClick={addEvent}>추가하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowAddEvent(false); resetEventForm() }}>취소</button>
          </div>
        </div>
      )}

      {/* 이벤트 수정 모달 */}
      {showEditEvent && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowEditEvent(false); resetEventForm() } }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>✏️ 이벤트 수정</div>
            <EventFormFields />
            <button style={styles.btn} onClick={saveEditEvent}>💾 저장하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowEditEvent(false); resetEventForm() }}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#F9FAFB', fontFamily:'sans-serif' },
  topbar: { background:'white', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  saveBtn: { background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', padding:'8px 18px', fontSize:'13px', fontWeight:700, cursor:'pointer' },
  content: { padding:'16px 16px 100px' },
  section: { background:'white', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'14px' },
  field: { marginBottom:'12px' },
  fieldRow: { display:'flex', gap:'12px' },
  label: { fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px', display:'block' },
  hint: { fontSize:'11px', color:'#9CA3AF', marginTop:'4px' },
  input: { width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif', background:'white' },
  addEventBtn: { background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', padding:'6px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' },
  eventCard: { display:'flex', alignItems:'center', gap:'10px', padding:'12px', background:'#F9FAFB', borderRadius:'12px', marginBottom:'8px' },
  delEventBtn: { background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'#9CA3AF', padding:'4px' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 40px' },
  modalHandle: { width:'40px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' },
  modalTitle: { fontSize:'18px', fontWeight:700, marginBottom:'20px' },
  btn: { width:'100%', padding:'14px', background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', fontSize:'15px', fontWeight:700, cursor:'pointer' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'8px' },
  saveFullBtn: { width:'100%', padding:'14px', background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'8px' }
}