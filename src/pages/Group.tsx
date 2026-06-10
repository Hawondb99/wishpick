import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { fetchProductFromUrl } from '../utils/fetchProduct'

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

export default function Group({ group: initialGroup, session, onBack }: { group: any, session: any, onBack: () => void }) {
  const [group, setGroup] = useState(initialGroup)
  const [wishes, setWishes] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSecretComments, setShowSecretComments] = useState<string | null>(null)
  const [editingWish, setEditingWish] = useState<any>(null)
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [addMode, setAddMode] = useState<'link'|'manual'>('link')
  const [loading, setLoading] = useState(true)
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [fetchingProduct, setFetchingProduct] = useState(false)
  const [productImageUrl, setProductImageUrl] = useState('')

  // 비밀 댓글
  const [secretComments, setSecretComments] = useState<Record<string, any[]>>({})
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [wishName, setWishName] = useState('')
  const [wishPrice, setWishPrice] = useState('')
  const [wishShop, setWishShop] = useState('')
  const [wishUrl, setWishUrl] = useState('')
  const [wishCategory, setWishCategory] = useState('기타')
  const [wishOccasion, setWishOccasion] = useState('평소 위시리스트')
  const [wishPriority, setWishPriority] = useState('medium')
  const [wishMemo, setWishMemo] = useState('')
  const [wishColor, setWishColor] = useState('')
  const [wishSize, setWishSize] = useState('')

  const [settingName, setSettingName] = useState('')
  const [settingVisibility, setSettingVisibility] = useState('surprise')
  const [settingEventMode, setSettingEventMode] = useState('individual')
  const [settingEventType, setSettingEventType] = useState('생일')
  const [settingEventTitle, setSettingEventTitle] = useState('')
  const [settingEventDate, setSettingEventDate] = useState('')
  const [settingCustomEvent, setSettingCustomEvent] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchMembers()
    fetchWishes()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, name, email, birthday, favorite_brands, favorite_colors, clothes_size, shoes_size, preferred_scent, skin_type, gift_preferences, unwanted_gifts)')
      .eq('group_id', group.id)
    if (data) setMembers(data.map((d: any) => d.profiles))
  }

  const fetchWishes = async () => {
    const { data } = await supabase
      .from('wishes')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  const fetchSecretComments = async (wishId: string) => {
    const { data } = await supabase
      .from('secret_memos')
      .select('*, profiles(name)')
      .eq('wish_id', wishId)
      .order('created_at', { ascending: true })
    if (data) {
      setSecretComments(prev => ({ ...prev, [wishId]: data }))
    }
  }

  const openSecretComments = async (wishId: string) => {
    setShowSecretComments(wishId)
    setNewComment('')
    await fetchSecretComments(wishId)
  }

  const addSecretComment = async (wishId: string) => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const { error } = await supabase.from('secret_memos').insert({
      wish_id: wishId,
      group_id: group.id,
      user_id: session.user.id,
      content: newComment.trim()
    })
    if (!error) {
      setNewComment('')
      await fetchSecretComments(wishId)
    }
    setSubmittingComment(false)
  }

  const deleteSecretComment = async (commentId: string, wishId: string) => {
    if (!confirm('댓글을 삭제할까요?')) return
    await supabase.from('secret_memos').delete().eq('id', commentId)
    await fetchSecretComments(wishId)
  }

  const resetForm = () => {
    setWishName(''); setWishPrice(''); setWishShop(''); setWishUrl('')
    setWishCategory('기타'); setWishOccasion('평소 위시리스트')
    setWishPriority('medium'); setWishMemo(''); setWishColor(''); setWishSize('')
    setProductImageUrl('')
  }

  const handleFetchProduct = async () => {
    if (!wishUrl.trim()) { alert('링크를 입력해주세요!'); return }
    setFetchingProduct(true)
    try {
      const info = await fetchProductFromUrl(wishUrl)
      if (info.name) setWishName(info.name)
      if (info.price) setWishPrice(String(info.price))
      if (info.shop) setWishShop(info.shop)
      if (info.category) setWishCategory(info.category)
      if (info.memo) setWishMemo(info.memo)
      if (info.imageUrl) setProductImageUrl(info.imageUrl)
      alert('✅ 상품 정보를 불러왔어요!')
    } catch (e) {
      alert('상품 정보를 불러오지 못했어요. 직접 입력해주세요.')
    }
    setFetchingProduct(false)
  }

  const openEdit = (w: any) => {
    setEditingWish(w)
    setWishName(w.name || '')
    setWishPrice(w.price ? String(w.price) : '')
    setWishShop(w.shop || '')
    setWishUrl(w.url || '')
    setWishCategory(w.category || '기타')
    setWishOccasion(w.occasion || '평소 위시리스트')
    setWishPriority(w.priority || 'medium')
    setWishMemo(w.memo || '')
    setWishColor(w.color || '')
    setWishSize(w.size || '')
    setProductImageUrl(w.image_url || '')
    setShowEdit(true)
  }

  const openSettings = () => {
    setSettingName(group.name || '')
    setSettingVisibility(group.buyer_visibility || 'surprise')
    setSettingEventMode(group.event_mode || 'individual')
    setSettingEventType(group.group_event_type || '생일')
    setSettingEventTitle(group.group_event_title || '')
    setSettingEventDate(group.group_event_date || '')
    setSettingCustomEvent('')
    setShowSettings(true)
  }

  const saveSettings = async () => {
    if (!settingName.trim()) { alert('그룹 이름을 입력해주세요!'); return }
    if (settingEventMode === 'group' && settingEventType !== '생일' && !settingEventDate) {
      alert('이벤트 날짜를 입력해주세요!'); return
    }
    const eventType = settingEventType === '기타' ? settingCustomEvent : settingEventType
    if (settingEventMode === 'group' && group.event_mode !== 'group') {
      const mismatchedWishes = wishes.filter(w =>
        w.occasion && w.occasion !== '평소 위시리스트' && w.occasion !== eventType
      )
      if (mismatchedWishes.length > 0) {
        const choice = window.confirm(
          `⚠️ 위시리스트 ${mismatchedWishes.length}개의 이벤트가 [${eventType}]과 달라요.\n\n확인 → 모두 [${eventType}]으로 변경\n취소 → 다른 이벤트 상품 삭제`
        )
        if (choice) {
          await supabase.from('wishes').update({ occasion: eventType }).eq('group_id', group.id).neq('occasion', eventType)
        } else {
          const confirmed = window.confirm(`정말로 [${eventType}]이 아닌 상품 ${mismatchedWishes.length}개를 삭제할까요?`)
          if (!confirmed) return
          await supabase.from('wishes').delete().eq('group_id', group.id).neq('occasion', eventType).neq('occasion', '평소 위시리스트')
        }
        fetchWishes()
      }
    }
    setSavingSettings(true)
    const { data, error } = await supabase
      .from('groups').update({
        name: settingName.trim(), buyer_visibility: settingVisibility,
        event_mode: settingEventMode,
        group_event_type: settingEventMode === 'group' ? eventType : null,
        group_event_title: settingEventMode === 'group' ? (settingEventTitle || eventType) : null,
        group_event_date: settingEventMode === 'group' && settingEventType !== '생일' ? settingEventDate : null,
      }).eq('id', group.id).select().single()
    setSavingSettings(false)
    if (!error && data) { setGroup(data); setShowSettings(false); alert('✅ 그룹 설정이 저장됐어요!') }
    else alert('오류: ' + error?.message)
  }

  const addWish = async () => {
    if (!wishName.trim()) { alert('상품명을 입력해주세요!'); return }
    const { error } = await supabase.from('wishes').insert({
      group_id: group.id, user_id: session.user.id, name: wishName,
      price: wishPrice ? parseInt(wishPrice) : null, shop: wishShop, url: wishUrl,
      image_url: productImageUrl, category: wishCategory, occasion: wishOccasion,
      priority: wishPriority, memo: wishMemo, color: wishColor, size: wishSize,
      buyer_visibility: group.buyer_visibility || 'surprise', status: 'available'
    })
    if (!error) { fetchWishes(); setShowAdd(false); resetForm() }
    else alert('오류: ' + error.message)
  }

  const saveEdit = async () => {
    if (!wishName.trim()) { alert('상품명을 입력해주세요!'); return }
    const { error } = await supabase.from('wishes').update({
      name: wishName, price: wishPrice ? parseInt(wishPrice) : null,
      shop: wishShop, url: wishUrl, image_url: productImageUrl,
      category: wishCategory, occasion: wishOccasion, priority: wishPriority,
      memo: wishMemo, color: wishColor, size: wishSize,
    }).eq('id', editingWish.id)
    if (!error) { fetchWishes(); setShowEdit(false); setEditingWish(null); resetForm() }
    else alert('수정 오류: ' + error.message)
  }

  const markBought = async (wish: any) => {
    if (wish.status === 'bought' && wish.bought_by === session.user.id) {
      await supabase.from('wishes').update({ status: 'available', bought_by: null }).eq('id', wish.id)
    } else {
      await supabase.from('wishes').update({ status: 'bought', bought_by: session.user.id }).eq('id', wish.id)
    }
    fetchWishes()
  }

  const markReceived = async (wish: any) => {
    if (wish.status === 'received') {
      await supabase.from('wishes').update({ status: 'available', received_at: null }).eq('id', wish.id)
    } else {
      await supabase.from('wishes').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', wish.id)
    }
    fetchWishes()
  }

  const deleteWish = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('wishes').delete().eq('id', id)
    fetchWishes()
  }

  const copyCode = () => {
    navigator.clipboard.writeText(group.invite_code)
    alert('✅ 초대 코드 복사됨: ' + group.invite_code)
  }

  const getBuyerText = (w: any) => {
    if (w.status !== 'bought') return null
    const isOwner = w.user_id === session.user.id
    const isBuyer = w.bought_by === session.user.id
    const buyerName = members.find(m => m.id === w.bought_by)?.name || '누군가'
    const visibility = group.buyer_visibility || 'surprise'
    if (isBuyer) return `🛍️ 내가 구매 예정이에요`
    if (visibility === 'public') return `🛍️ ${buyerName}가 구매 예정이에요`
    if (visibility === 'surprise') {
      if (isOwner) return `🛍️ 누군가 구매 예정이에요`
      return `🛍️ ${buyerName}가 구매 예정이에요`
    }
    return `🛍️ 누군가 구매 예정이에요`
  }

  const isGroupCreator = group.created_by === session.user.id
  const filteredWishes = wishes.filter(w => {
    if (filterMember !== 'all' && w.user_id !== filterMember) return false
    if (filterCategory !== 'all' && w.category !== filterCategory) return false
    return true
  })

  const categories = ['all', ...new Set(wishes.map(w => w.category))]
  const catLabel: Record<string, string> = {
    all:'전체', '패션':'패션', '뷰티':'뷰티', '전자기기':'전자기기',
    '인테리어':'인테리어', '취미':'취미', '식품':'식품', '생활용품':'생활용품', '기타':'기타'
  }
  const priorityLabel: Record<string, string> = {
    high:'⭐ 꼭 받고 싶어요', medium:'😊 받으면 좋아요', low:'💭 언젠가 사고 싶어요'
  }
  const priorityColor: Record<string, string> = { high:'#FEE2E2', medium:'#FEF3C7', low:'#F3F4F6' }
  const priorityTextColor: Record<string, string> = { high:'#991B1B', medium:'#92400E', low:'#374151' }

  if (viewingProfile) {
    return (
      <div style={styles.container}>
        <div style={styles.topbar}>
          <button style={styles.backBtn} onClick={() => setViewingProfile(null)}>←</button>
          <div style={{fontWeight:700, fontSize:'17px'}}>{viewingProfile.name}님의 프로필</div>
          <div style={{width:'32px'}} />
        </div>
        <div style={{padding:'16px 16px 100px'}}>
          {viewingProfile.birthday && (
            <div style={pCard}><div style={pTitle}>🎂 생일</div>
              <div style={{fontSize:'15px', fontWeight:600, color:'#F472B6'}}>{viewingProfile.birthday}</div>
            </div>
          )}
          <div style={pCard}>
            <div style={pTitle}>💝 취향 정보</div>
            {viewingProfile.favorite_brands?.length > 0 && <div style={pRow}><span style={pLabel}>좋아하는 브랜드</span><span style={pVal}>{viewingProfile.favorite_brands.join(', ')}</span></div>}
            {viewingProfile.favorite_colors?.length > 0 && <div style={pRow}><span style={pLabel}>좋아하는 색상</span><span style={pVal}>{viewingProfile.favorite_colors.join(', ')}</span></div>}
            {viewingProfile.preferred_scent && <div style={pRow}><span style={pLabel}>선호하는 향</span><span style={pVal}>{viewingProfile.preferred_scent}</span></div>}
            {viewingProfile.skin_type && <div style={pRow}><span style={pLabel}>피부 타입</span><span style={pVal}>{viewingProfile.skin_type}</span></div>}
            {!viewingProfile.favorite_brands?.length && !viewingProfile.favorite_colors?.length && (
              <div style={{fontSize:'13px', color:'#9CA3AF'}}>아직 취향 정보가 없어요</div>
            )}
          </div>
          {(viewingProfile.clothes_size || viewingProfile.shoes_size) && (
            <div style={pCard}>
              <div style={pTitle}>📏 사이즈</div>
              {viewingProfile.clothes_size && <div style={pRow}><span style={pLabel}>옷 사이즈</span><span style={pVal}>{viewingProfile.clothes_size}</span></div>}
              {viewingProfile.shoes_size && <div style={pRow}><span style={pLabel}>신발 사이즈</span><span style={pVal}>{viewingProfile.shoes_size}</span></div>}
            </div>
          )}
          {viewingProfile.gift_preferences && (
            <div style={pCard}><div style={pTitle}>🎁 이런 선물을 좋아해요</div>
              <div style={{fontSize:'14px', color:'#374151', lineHeight:'1.6'}}>{viewingProfile.gift_preferences}</div>
            </div>
          )}
          {viewingProfile.unwanted_gifts && (
            <div style={{...pCard, borderLeft:'3px solid #FCA5A5'}}>
              <div style={{...pTitle, color:'#EF4444'}}>🚫 이런 선물은 받고 싶지 않아요</div>
              <div style={{fontSize:'14px', color:'#374151', lineHeight:'1.6'}}>{viewingProfile.unwanted_gifts}</div>
            </div>
          )}
          {!viewingProfile.favorite_brands?.length && !viewingProfile.gift_preferences && !viewingProfile.clothes_size && !viewingProfile.birthday && (
            <div style={{textAlign:'center', padding:'48px 24px', color:'#9CA3AF'}}>
              <div style={{fontSize:'48px', marginBottom:'12px'}}>👤</div>
              <div style={{fontWeight:600}}>아직 프로필을 작성하지 않았어요</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const wishFormContent = (
    <>
      <div style={styles.modeTabs}>
        <button style={{...styles.modeTab, ...(addMode==='link' ? styles.modeTabActive : {})}} onClick={() => setAddMode('link')}>🔗 링크로 추가</button>
        <button style={{...styles.modeTab, ...(addMode==='manual' ? styles.modeTabActive : {})}} onClick={() => setAddMode('manual')}>✏️ 직접 입력</button>
      </div>
      {addMode === 'link' && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
            <input style={{...styles.input, marginBottom:0, flex:1}} placeholder="상품 링크 (https://...)" value={wishUrl} onChange={e => setWishUrl(e.target.value)} type="url" />
            <button style={{background: fetchingProduct ? '#E5E7EB' : 'linear-gradient(135deg, #F472B6, #A78BFA)', color: fetchingProduct ? '#9CA3AF' : 'white', border:'none', borderRadius:'10px', padding:'0 16px', fontSize:'13px', fontWeight:600, cursor: fetchingProduct ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', flexShrink:0}} onClick={handleFetchProduct} disabled={fetchingProduct}>
              {fetchingProduct ? '⏳...' : '🔍 자동 인식'}
            </button>
          </div>
          {productImageUrl && (
            <div style={{background:'#F9FAFB', borderRadius:'10px', padding:'10px', fontSize:'12px', color:'#6B7280', display:'flex', alignItems:'center', gap:'8px'}}>
              <img src={productImageUrl} style={{width:'48px', height:'48px', objectFit:'cover', borderRadius:'6px'}} onError={e => (e.currentTarget.style.display='none')} />
              <span>✅ 상품 이미지를 불러왔어요!</span>
            </div>
          )}
        </div>
      )}
      {productImageUrl && (
        <div style={{textAlign:'center', marginBottom:'12px'}}>
          <img src={productImageUrl} style={{width:'100px', height:'100px', objectFit:'cover', borderRadius:'12px', border:'1.5px solid #E5E7EB'}} onError={e => (e.currentTarget.style.display='none')} />
        </div>
      )}
      <input style={styles.input} placeholder="상품명 *" value={wishName} onChange={e => setWishName(e.target.value)} />
      <input style={styles.input} placeholder="가격 (예: 50,000)" value={wishPrice ? Number(wishPrice.replace(/,/g, '')).toLocaleString() : ''} onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(raw)) setWishPrice(raw) }} type="text" inputMode="numeric" />
      <input style={styles.input} placeholder="파는 곳 (예: 쿠팡, 올리브영)" value={wishShop} onChange={e => setWishShop(e.target.value)} />
      <select style={styles.input} value={wishCategory} onChange={e => setWishCategory(e.target.value)}>
        {['패션','뷰티','전자기기','인테리어','취미','식품','생활용품','도서','육아','반려동물','여행','기타'].map(c => <option key={c}>{c}</option>)}
      </select>
      <select style={styles.input} value={wishOccasion} onChange={e => setWishOccasion(e.target.value)}>
        {['평소 위시리스트','생일','결혼기념일','연애기념일','베이비샤워','발렌타인데이','화이트데이','크리스마스','집들이','졸업','결혼','입사/승진','명절','기타'].map(o => <option key={o}>{o}</option>)}
      </select>
      <select style={styles.input} value={wishPriority} onChange={e => setWishPriority(e.target.value)}>
        <option value="high">⭐ 꼭 받고 싶어요</option>
        <option value="medium">😊 받으면 좋아요</option>
        <option value="low">💭 언젠가 사고 싶어요</option>
      </select>
      <input style={styles.input} placeholder="원하는 색상 (예: 아이보리)" value={wishColor} onChange={e => setWishColor(e.target.value)} />
      <input style={styles.input} placeholder="사이즈 (예: M, 240)" value={wishSize} onChange={e => setWishSize(e.target.value)} />
      <input style={styles.input} placeholder="메모 (예: 50ml 사이즈로 부탁해요)" value={wishMemo} onChange={e => setWishMemo(e.target.value)} />
    </>
  )

  // 비밀 댓글 모달
  const currentWish = wishes.find(w => w.id === showSecretComments)
  const currentComments = showSecretComments ? (secretComments[showSecretComments] || []) : []

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px', flex:1, textAlign:'center'}}>{group.name}</div>
        <div style={{display:'flex', gap:'6px'}}>
          {isGroupCreator && <button style={styles.settingsBtn} onClick={openSettings}>⚙️</button>}
          <button style={styles.shareBtn} onClick={() => setShowInvite(true)}>공유</button>
        </div>
      </div>

      <div style={styles.hero}>
        <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'6px'}}>초대 코드</div>
        <div style={styles.codeBox} onClick={copyCode}>
          <span style={{fontSize:'22px', fontWeight:700, letterSpacing:'4px', color:'#F472B6'}}>{group.invite_code}</span>
          <span style={{fontSize:'12px', color:'#9CA3AF', marginLeft:'8px'}}>📋 탭해서 복사</span>
        </div>
        {group.event_mode === 'group' && group.group_event_title && (
          <div style={{marginTop:'8px', fontSize:'13px', color:'#6B7280'}}>
            {eventEmoji[group.group_event_type] || '📅'} {group.group_event_title}
            {group.group_event_date && <span style={{marginLeft:'6px', color:'#F472B6', fontWeight:600}}>· {group.group_event_date}</span>}
          </div>
        )}
      </div>

      <div style={styles.tabsWrap}>
        <div style={styles.tabs}>
          <div style={{...styles.tab, ...(filterMember==='all' ? styles.tabActive : {})}} onClick={() => setFilterMember('all')}>🎁 전체</div>
          {members.map(m => (
            <div key={m.id} style={{display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
              <div style={{...styles.tab, ...(filterMember===m.id ? styles.tabActive : {})}} onClick={() => setFilterMember(m.id)}>
                {m.id === session.user.id ? `${m.name} (나)` : m.name}
              </div>
              {m.id !== session.user.id && (
                <button style={{...styles.tab, padding:'6px 10px', fontSize:'14px', background:'#EDE9FE', border:'none', color:'#A78BFA', cursor:'pointer'}} onClick={() => setViewingProfile(m)}>👤</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.filterWrap}>
        {categories.map(c => (
          <div key={c} style={{...styles.filterChip, ...(filterCategory===c ? styles.filterActive : {})}} onClick={() => setFilterCategory(c)}>
            {catLabel[c] || c}
          </div>
        ))}
      </div>

      <div style={styles.wishList}>
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', fontSize:'24px'}}>🎁</div>
        ) : filteredWishes.length === 0 ? (
          <div style={styles.empty}>
            <div style={{fontSize:'48px', marginBottom:'12px'}}>🎀</div>
            <div style={{fontWeight:600, marginBottom:'6px'}}>위시리스트가 비어있어요</div>
            <div style={{fontSize:'13px', color:'#9CA3AF'}}>+ 버튼을 눌러 원하는 선물을 추가해보세요!</div>
          </div>
        ) : filteredWishes.map(w => (
          <div key={w.id} style={{...styles.wishCard, opacity: w.status==='received' ? 0.6 : 1}}>
            {w.status === 'received' && <div style={styles.receivedBadge}>✅ 이미 받았어요</div>}
            {w.status === 'bought' && <div style={styles.boughtBadge}>{getBuyerText(w)}</div>}
            <div style={{display:'flex', gap:'12px', alignItems:'flex-start'}}>
              <div style={styles.wishThumb}>
                {w.image_url ? (
                  <img src={w.image_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} onError={e => { e.currentTarget.style.display='none' }} />
                ) : '🎁'}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:'11px', color:'#9CA3AF', marginBottom:'3px'}}>
                  {members.find(m => m.id === w.user_id)?.name || ''}의 위시
                  {w.occasion && w.occasion !== '평소 위시리스트' && (
                    <span style={{marginLeft:'6px', background:'#EDE9FE', color:'#A78BFA', padding:'1px 6px', borderRadius:'50px', fontSize:'10px'}}>{w.occasion}</span>
                  )}
                </div>
                <div style={styles.wishName}>{w.name}</div>
                <div style={styles.wishPrice}>{w.price ? `${w.price.toLocaleString()}원` : '가격 미정'}</div>
                <div style={styles.tagRow}>
                  <span style={styles.tag}>{w.category}</span>
                  {w.shop && <span style={{...styles.tag, background:'#FFF7ED', color:'#FB923C'}}>{w.shop}</span>}
                  <span style={{...styles.tag, background: priorityColor[w.priority], color: priorityTextColor[w.priority]}}>{priorityLabel[w.priority]}</span>
                </div>
                {w.memo && <div style={{fontSize:'12px', color:'#6B7280', marginTop:'4px'}}>💬 {w.memo}</div>}
                {(w.color || w.size) && <div style={{fontSize:'12px', color:'#6B7280', marginTop:'2px'}}>{w.color && `🎨 ${w.color}`} {w.size && `📏 ${w.size}`}</div>}
                <div style={styles.btnRow}>
                  {w.url && <button style={styles.linkBtn} onClick={() => window.open(w.url, '_blank')}>🔗 보러가기</button>}
                  {w.user_id !== session.user.id && w.status !== 'received' && (
                    w.status === 'bought' && w.bought_by === session.user.id ? (
                      <button style={{...styles.buyBtn, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markBought(w)}>↩️ 취소</button>
                    ) : w.status === 'available' ? (
                      <button style={styles.buyBtn} onClick={() => markBought(w)}>🛍️ 내가 살게요</button>
                    ) : null
                  )}
                  {w.user_id === session.user.id && (
                    w.status === 'received' ? (
                      <button style={{...styles.receivedBtn, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markReceived(w)}>↩️ 취소</button>
                    ) : (
                      <button style={styles.receivedBtn} onClick={() => markReceived(w)}>✅ 받았어요</button>
                    )
                  )}
                  {/* 비밀 댓글 버튼 - 선물 주인은 못 봄 */}
                  {w.user_id !== session.user.id && (
                    <button style={styles.secretBtn} onClick={() => openSecretComments(w.id)}>
                      🤫 비밀 댓글
                    </button>
                  )}
                  {w.user_id === session.user.id && <button style={styles.editBtn} onClick={() => openEdit(w)}>✏️</button>}
                  {w.user_id === session.user.id && <button style={styles.delBtn} onClick={() => deleteWish(w.id)}>🗑️</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={styles.fab} onClick={() => { resetForm(); setShowAdd(true) }}>+</button>

      {/* 위시 추가 모달 */}
      {showAdd && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>🎁 위시리스트에 추가</div>
            {wishFormContent}
            <button style={styles.btn} onClick={addWish}>🎁 추가하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowAdd(false); resetForm() }}>취소</button>
          </div>
        </div>
      )}

      {/* 위시 수정 모달 */}
      {showEdit && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowEdit(false); resetForm() } }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>✏️ 위시 수정하기</div>
            {wishFormContent}
            <button style={styles.btn} onClick={saveEdit}>💾 저장하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowEdit(false); resetForm() }}>취소</button>
          </div>
        </div>
      )}

      {/* 초대 모달 */}
      {showInvite && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>👥 친구·파트너 초대</div>
            <div style={styles.inviteBox}>
              <div style={{fontSize:'32px', fontWeight:700, letterSpacing:'8px', color:'#F472B6', marginBottom:'8px'}}>{group.invite_code}</div>
              <div style={{fontSize:'12px', color:'#9CA3AF'}}>이 코드를 친구에게 알려주세요</div>
            </div>
            <button style={styles.btn} onClick={copyCode}>📋 코드 복사하기</button>
            <button style={styles.cancelBtn} onClick={() => setShowInvite(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 비밀 댓글 모달 */}
      {showSecretComments && currentWish && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowSecretComments(null) }}>
          <div style={{...styles.modal, maxHeight:'80vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={{marginBottom:'16px'}}>
              <div style={styles.modalTitle}>🤫 비밀 댓글</div>
              <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'4px'}}>선물 주인({members.find(m => m.id === currentWish.user_id)?.name})은 이 댓글을 볼 수 없어요</div>
            </div>

            {/* 상품 정보 */}
            <div style={{background:'#F9FAFB', borderRadius:'12px', padding:'12px', marginBottom:'16px', display:'flex', gap:'10px', alignItems:'center'}}>
              <div style={{width:'40px', height:'40px', background:'#E5E7EB', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0, overflow:'hidden'}}>
                {currentWish.image_url ? <img src={currentWish.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : '🎁'}
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:600, color:'#111827'}}>{currentWish.name}</div>
                <div style={{fontSize:'12px', color:'#F472B6'}}>{currentWish.price ? `${currentWish.price.toLocaleString()}원` : '가격 미정'}</div>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div style={{marginBottom:'16px', maxHeight:'300px', overflowY:'auto'}}>
              {currentComments.length === 0 ? (
                <div style={{textAlign:'center', padding:'24px', color:'#9CA3AF', fontSize:'13px'}}>
                  아직 비밀 댓글이 없어요<br/>첫 번째 댓글을 남겨보세요! 🤫
                </div>
              ) : currentComments.map((c: any) => (
                <div key={c.id} style={{
                  marginBottom:'10px', padding:'10px 12px', borderRadius:'12px',
                  background: c.user_id === session.user.id ? '#FDF2F8' : '#F9FAFB',
                  border: `1px solid ${c.user_id === session.user.id ? '#FCE7F3' : '#F3F4F6'}`
                }}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{fontSize:'12px', fontWeight:600, color: c.user_id === session.user.id ? '#F472B6' : '#374151'}}>
                      {c.profiles?.name || '알 수 없음'} {c.user_id === session.user.id ? '(나)' : ''}
                    </span>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <span style={{fontSize:'10px', color:'#9CA3AF'}}>
                        {new Date(c.created_at).toLocaleDateString('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                      </span>
                      {c.user_id === session.user.id && (
                        <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'#9CA3AF', padding:'0'}} onClick={() => deleteSecretComment(c.id, currentWish.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                  <div style={{fontSize:'13px', color:'#374151', lineHeight:'1.5'}}>{c.content}</div>
                </div>
              ))}
            </div>

            {/* 댓글 입력 */}
            <div style={{display:'flex', gap:'8px'}}>
              <input
                style={{...styles.input, marginBottom:0, flex:1}}
                placeholder="비밀 댓글 입력... (선물 주인은 못 봐요)"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !submittingComment && addSecretComment(currentWish.id)}
              />
              <button
                style={{background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'10px', padding:'0 16px', fontSize:'13px', fontWeight:600, cursor:'pointer', flexShrink:0}}
                onClick={() => addSecretComment(currentWish.id)}
                disabled={submittingComment}
              >
                {submittingComment ? '...' : '전송'}
              </button>
            </div>
            <button style={styles.cancelBtn} onClick={() => setShowSecretComments(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* 그룹 설정 모달 */}
      {showSettings && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div style={{...styles.modal, maxHeight:'92vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
              <div style={styles.modalTitle}>⚙️ 그룹 설정</div>
              <span style={{fontSize:'11px', background:'#FEF3C7', color:'#92400E', padding:'3px 8px', borderRadius:'50px', fontWeight:600}}>그룹장만 수정 가능</span>
            </div>
            <div style={settingSection}>
              <div style={settingTitle}>📝 기본 정보</div>
              <label style={styles.label}>그룹 이름</label>
              <input style={styles.input} value={settingName} onChange={e => setSettingName(e.target.value)} />
            </div>
            <div style={settingSection}>
              <div style={settingTitle}>📅 이벤트 설정</div>
              <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                {[
                  { value: 'individual', label: '👤 개별 이벤트', desc: '각자의 생일·기념일' },
                  { value: 'group', label: '🎉 공통 이벤트', desc: '베이비샤워·승진 등' }
                ].map(opt => (
                  <div key={opt.value} onClick={() => setSettingEventMode(opt.value)} style={{
                    flex:1, padding:'10px', borderRadius:'10px', cursor:'pointer', textAlign:'center',
                    border:`1.5px solid ${settingEventMode === opt.value ? '#F472B6' : '#E5E7EB'}`,
                    background: settingEventMode === opt.value ? '#FDF2F8' : 'white'
                  }}>
                    <div style={{fontSize:'13px', fontWeight:600, color: settingEventMode === opt.value ? '#F472B6' : '#374151'}}>{opt.label}</div>
                    <div style={{fontSize:'11px', color:'#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
                  </div>
                ))}
              </div>
              {settingEventMode === 'group' && (
                <>
                  <label style={styles.label}>이벤트 종류</label>
                  <select style={styles.input} value={settingEventType} onChange={e => setSettingEventType(e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {settingEventType === '기타' && <input style={styles.input} placeholder="이벤트 이름" value={settingCustomEvent} onChange={e => setSettingCustomEvent(e.target.value)} />}
                  <label style={styles.label}>이벤트 이름</label>
                  <input style={styles.input} value={settingEventTitle} onChange={e => setSettingEventTitle(e.target.value)} />
                  {settingEventType === '생일' ? (
                    <div style={{background:'#FDF2F8', borderRadius:'10px', padding:'10px', fontSize:'12px', color:'#F472B6', marginBottom:'12px'}}>🎂 각 멤버의 프로필 생일이 자동으로 연동돼요!</div>
                  ) : (
                    <>
                      <label style={styles.label}>이벤트 날짜</label>
                      <input style={styles.input} type="date" value={settingEventDate} onChange={e => setSettingEventDate(e.target.value)} />
                    </>
                  )}
                </>
              )}
              {settingEventMode === 'individual' && (
                <div style={{background:'#EDE9FE', borderRadius:'10px', padding:'10px', fontSize:'12px', color:'#A78BFA'}}>👤 각 멤버가 프로필에서 자신의 이벤트를 추가해요!</div>
              )}
            </div>
            <div style={settingSection}>
              <div style={settingTitle}>👀 구매자 공개 설정</div>
              {[
                { value: 'surprise', label: '🎁 서프라이즈 모드', desc: '받는 사람에게 구매자가 보이지 않아요' },
                { value: 'public', label: '👀 모두 공개', desc: '그룹 멤버 모두 구매자를 볼 수 있어요' },
                { value: 'private', label: '🔒 완전 비공개', desc: '구매자 이름을 모두에게 숨겨요' },
              ].map(opt => (
                <div key={opt.value} onClick={() => setSettingVisibility(opt.value)} style={{
                  padding:'10px 12px', marginBottom:'8px', borderRadius:'10px', cursor:'pointer',
                  border:`1.5px solid ${settingVisibility === opt.value ? '#F472B6' : '#E5E7EB'}`,
                  background: settingVisibility === opt.value ? '#FDF2F8' : 'white',
                  display:'flex', alignItems:'center', justifyContent:'space-between'
                }}>
                  <div>
                    <div style={{fontSize:'13px', fontWeight:600, color: settingVisibility === opt.value ? '#F472B6' : '#374151'}}>{opt.label}</div>
                    <div style={{fontSize:'11px', color:'#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
                  </div>
                  {settingVisibility === opt.value && <span style={{color:'#F472B6'}}>✅</span>}
                </div>
              ))}
            </div>
            <button style={styles.btn} onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? '저장 중...' : '💾 설정 저장하기'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowSettings(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

const pCard: React.CSSProperties = { background:'white', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }
const pTitle: React.CSSProperties = { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'12px' }
const pRow: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', gap:'12px' }
const pLabel: React.CSSProperties = { fontSize:'13px', color:'#6B7280', flexShrink:0 }
const pVal: React.CSSProperties = { fontSize:'13px', color:'#111827', fontWeight:500, textAlign:'right' }
const settingSection: React.CSSProperties = { background:'#F9FAFB', borderRadius:'12px', padding:'14px', marginBottom:'12px' }
const settingTitle: React.CSSProperties = { fontSize:'14px', fontWeight:700, color:'#374151', marginBottom:'12px' }

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#F9FAFB', fontFamily:'sans-serif' },
  topbar: { background:'white', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  shareBtn: { background:'white', border:'1.5px solid #E5E7EB', borderRadius:'50px', padding:'8px 16px', fontSize:'13px', cursor:'pointer' },
  settingsBtn: { background:'#F3F4F6', border:'none', borderRadius:'50px', padding:'8px 12px', fontSize:'16px', cursor:'pointer' },
  hero: { background:'linear-gradient(135deg, #FDF2F8, #EDE9FE)', padding:'20px', textAlign:'center' },
  codeBox: { display:'inline-flex', alignItems:'center', background:'white', borderRadius:'50px', padding:'10px 20px', cursor:'pointer', border:'1px solid #E5E7EB' },
  tabsWrap: { background:'white', borderBottom:'1px solid #F3F4F6', overflowX:'auto' },
  tabs: { display:'flex', padding:'12px 16px 0', gap:'8px', minWidth:'max-content' },
  tab: { padding:'8px 16px', borderRadius:'50px', fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', whiteSpace:'nowrap' },
  tabActive: { background:'#F472B6', borderColor:'#F472B6', color:'white' },
  filterWrap: { display:'flex', padding:'12px 16px', gap:'8px', overflowX:'auto', background:'white' },
  filterChip: { padding:'6px 14px', borderRadius:'50px', fontSize:'12px', fontWeight:500, cursor:'pointer', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', whiteSpace:'nowrap', flexShrink:0 },
  filterActive: { background:'#EDE9FE', borderColor:'#A78BFA', color:'#A78BFA', fontWeight:700 },
  wishList: { padding:'12px 16px 100px', display:'flex', flexDirection:'column', gap:'10px' },
  empty: { textAlign:'center', padding:'48px 24px', color:'#6B7280' },
  wishCard: { background:'white', borderRadius:'16px', padding:'14px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', position:'relative' },
  receivedBadge: { background:'rgba(52,211,153,0.9)', color:'white', padding:'4px 12px', borderRadius:'50px', fontSize:'12px', fontWeight:700, marginBottom:'8px', display:'inline-block' },
  boughtBadge: { background:'#FEF3C7', color:'#92400E', padding:'4px 12px', borderRadius:'50px', fontSize:'12px', fontWeight:600, marginBottom:'8px', display:'inline-block' },
  wishThumb: { width:'64px', height:'64px', background:'#F3F4F6', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0, overflow:'hidden' },
  wishName: { fontSize:'14px', fontWeight:600, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  wishPrice: { fontSize:'15px', fontWeight:700, color:'#F472B6', marginBottom:'5px' },
  tagRow: { display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'6px' },
  tag: { fontSize:'11px', padding:'3px 8px', borderRadius:'50px', background:'#EDE9FE', color:'#A78BFA', fontWeight:500 },
  btnRow: { display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'6px' },
  linkBtn: { background:'#FCE7F3', color:'#F472B6', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  buyBtn: { background:'#D1FAE5', color:'#059669', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  receivedBtn: { background:'#EDE9FE', color:'#A78BFA', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  secretBtn: { background:'#FEF3C7', color:'#92400E', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  editBtn: { background:'#F3F4F6', color:'#6B7280', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', cursor:'pointer' },
  delBtn: { background:'#F3F4F6', color:'#9CA3AF', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', cursor:'pointer' },
  fab: { position:'fixed', bottom:'24px', right:'20px', width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg, #F472B6, #A78BFA)', border:'none', cursor:'pointer', fontSize:'26px', color:'white', boxShadow:'0 4px 20px rgba(244,114,182,0.5)', zIndex:100 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 40px' },
  modalHandle: { width:'40px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' },
  modalTitle: { fontSize:'18px', fontWeight:700, marginBottom:'0' },
  modeTabs: { display:'flex', marginBottom:'16px', borderRadius:'10px', overflow:'hidden', border:'1.5px solid #E5E7EB', marginTop:'20px' },
  modeTab: { flex:1, padding:'10px', textAlign:'center', cursor:'pointer', fontSize:'13px', fontWeight:500, color:'#6B7280', background:'white', border:'none', fontFamily:'sans-serif' },
  modeTabActive: { background:'#F472B6', color:'white', fontWeight:700 },
  input: { width:'100%', padding:'13px 16px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif' },
  btn: { width:'100%', padding:'14px', background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', fontSize:'15px', fontWeight:700, cursor:'pointer' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'8px' },
  inviteBox: { background:'#F9FAFB', borderRadius:'16px', padding:'24px', textAlign:'center', border:'2px dashed #E5E7EB', marginBottom:'16px' },
  label: { fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px', display:'block' }
}