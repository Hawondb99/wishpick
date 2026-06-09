import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Group({ group, session, onBack }: { group: any, session: any, onBack: () => void }) {
  const [wishes, setWishes] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingWish, setEditingWish] = useState<any>(null)
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [addMode, setAddMode] = useState<'link'|'manual'>('link')
  const [loading, setLoading] = useState(true)
  const [viewingProfile, setViewingProfile] = useState<any>(null)

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

  const resetForm = () => {
    setWishName(''); setWishPrice(''); setWishShop(''); setWishUrl('')
    setWishCategory('기타'); setWishOccasion('평소 위시리스트')
    setWishPriority('medium'); setWishMemo(''); setWishColor(''); setWishSize('')
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
    setShowEdit(true)
  }

  const addWish = async () => {
    if (!wishName.trim()) { alert('상품명을 입력해주세요!'); return }
    const { error } = await supabase.from('wishes').insert({
      group_id: group.id,
      user_id: session.user.id,
      name: wishName,
      price: wishPrice ? parseInt(wishPrice) : null,
      shop: wishShop,
      url: wishUrl,
      category: wishCategory,
      occasion: wishOccasion,
      priority: wishPriority,
      memo: wishMemo,
      color: wishColor,
      size: wishSize,
      buyer_visibility: group.buyer_visibility || 'surprise',
      status: 'available'
    })
    if (!error) {
      fetchWishes()
      setShowAdd(false)
      resetForm()
    } else {
      alert('오류: ' + error.message)
    }
  }

  const saveEdit = async () => {
    if (!wishName.trim()) { alert('상품명을 입력해주세요!'); return }
    const { error } = await supabase.from('wishes').update({
      name: wishName,
      price: wishPrice ? parseInt(wishPrice) : null,
      shop: wishShop,
      url: wishUrl,
      category: wishCategory,
      occasion: wishOccasion,
      priority: wishPriority,
      memo: wishMemo,
      color: wishColor,
      size: wishSize,
    }).eq('id', editingWish.id)
    if (!error) {
      fetchWishes()
      setShowEdit(false)
      setEditingWish(null)
      resetForm()
    } else {
      alert('수정 오류: ' + error.message)
    }
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

  // 멤버 프로필 보기
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
            <div style={pCard}>
              <div style={pTitle}>🎂 생일</div>
              <div style={{fontSize:'15px', fontWeight:600, color:'#F472B6'}}>{viewingProfile.birthday}</div>
            </div>
          )}
          <div style={pCard}>
            <div style={pTitle}>💝 취향 정보</div>
            {viewingProfile.favorite_brands?.length > 0 && (
              <div style={pRow}><span style={pLabel}>좋아하는 브랜드</span><span style={pVal}>{viewingProfile.favorite_brands.join(', ')}</span></div>
            )}
            {viewingProfile.favorite_colors?.length > 0 && (
              <div style={pRow}><span style={pLabel}>좋아하는 색상</span><span style={pVal}>{viewingProfile.favorite_colors.join(', ')}</span></div>
            )}
            {viewingProfile.preferred_scent && (
              <div style={pRow}><span style={pLabel}>선호하는 향</span><span style={pVal}>{viewingProfile.preferred_scent}</span></div>
            )}
            {viewingProfile.skin_type && (
              <div style={pRow}><span style={pLabel}>피부 타입</span><span style={pVal}>{viewingProfile.skin_type}</span></div>
            )}
            {!viewingProfile.favorite_brands?.length && !viewingProfile.favorite_colors?.length && !viewingProfile.preferred_scent && !viewingProfile.skin_type && (
              <div style={{fontSize:'13px', color:'#9CA3AF'}}>아직 취향 정보가 없어요</div>
            )}
          </div>
          {(viewingProfile.clothes_size || viewingProfile.shoes_size) && (
            <div style={pCard}>
              <div style={pTitle}>📏 사이즈</div>
              {viewingProfile.clothes_size && (
                <div style={pRow}><span style={pLabel}>옷 사이즈</span><span style={pVal}>{viewingProfile.clothes_size}</span></div>
              )}
              {viewingProfile.shoes_size && (
                <div style={pRow}><span style={pLabel}>신발 사이즈</span><span style={pVal}>{viewingProfile.shoes_size}</span></div>
              )}
            </div>
          )}
          {viewingProfile.gift_preferences && (
            <div style={pCard}>
              <div style={pTitle}>🎁 이런 선물을 좋아해요</div>
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
              <div style={{fontWeight:600, marginBottom:'6px'}}>아직 프로필을 작성하지 않았어요</div>
              <div style={{fontSize:'13px'}}>이 멤버에게 프로필을 작성해달라고 해봐요!</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px'}}>{group.name}</div>
        <button style={styles.shareBtn} onClick={() => setShowInvite(true)}>공유</button>
      </div>

      <div style={styles.hero}>
        <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'6px'}}>초대 코드</div>
        <div style={styles.codeBox} onClick={copyCode}>
          <span style={{fontSize:'22px', fontWeight:700, letterSpacing:'4px', color:'#F472B6'}}>{group.invite_code}</span>
          <span style={{fontSize:'12px', color:'#9CA3AF', marginLeft:'8px'}}>📋 탭해서 복사</span>
        </div>
      </div>

      <div style={styles.tabsWrap}>
        <div style={styles.tabs}>
          <div style={{...styles.tab, ...(filterMember==='all' ? styles.tabActive : {})}} onClick={() => setFilterMember('all')}>🎁 전체</div>
          {members.map(m => (
            <div key={m.id} style={{display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
              <div
                style={{...styles.tab, ...(filterMember===m.id ? styles.tabActive : {})}}
                onClick={() => setFilterMember(m.id)}
              >
                {m.id === session.user.id ? `${m.name} (나)` : m.name}
              </div>
              {m.id !== session.user.id && (
                <button
                  style={{...styles.tab, padding:'6px 10px', fontSize:'14px', background:'#EDE9FE', border:'none', color:'#A78BFA', cursor:'pointer'}}
                  onClick={() => setViewingProfile(m)}
                >
                  👤
                </button>
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
            {w.status === 'received' && (
              <div style={styles.receivedBadge}>✅ 이미 받았어요</div>
            )}
            {w.status === 'bought' && (
              <div style={styles.boughtBadge}>{getBuyerText(w)}</div>
            )}
            <div style={{display:'flex', gap:'12px', alignItems:'flex-start'}}>
              <div style={styles.wishThumb}>🎁</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:'11px', color:'#9CA3AF', marginBottom:'3px'}}>
                  {members.find(m => m.id === w.user_id)?.name || ''}의 위시
                  {w.occasion && w.occasion !== '평소 위시리스트' && (
                    <span style={{marginLeft:'6px', background:'#EDE9FE', color:'#A78BFA', padding:'1px 6px', borderRadius:'50px', fontSize:'10px'}}>{w.occasion}</span>
                  )}
                </div>
                <div style={styles.wishName}>{w.name}</div>
                <div style={styles.wishPrice}>
                  {w.price ? `${w.price.toLocaleString()}원` : '가격 미정'}
                </div>
                <div style={styles.tagRow}>
                  <span style={styles.tag}>{w.category}</span>
                  {w.shop && <span style={{...styles.tag, background:'#FFF7ED', color:'#FB923C'}}>{w.shop}</span>}
                  <span style={{...styles.tag, background: priorityColor[w.priority], color: priorityTextColor[w.priority]}}>
                    {priorityLabel[w.priority]}
                  </span>
                </div>
                {w.memo && <div style={{fontSize:'12px', color:'#6B7280', marginTop:'4px'}}>💬 {w.memo}</div>}
                {(w.color || w.size) && (
                  <div style={{fontSize:'12px', color:'#6B7280', marginTop:'2px'}}>
                    {w.color && `🎨 ${w.color}`} {w.size && `📏 ${w.size}`}
                  </div>
                )}
                <div style={styles.btnRow}>
                  {w.url && <button style={styles.linkBtn} onClick={() => window.open(w.url, '_blank')}>🔗 보러가기</button>}
                  {w.user_id !== session.user.id && w.status !== 'received' && (
                    w.status === 'bought' && w.bought_by === session.user.id ? (
                      <button style={{...styles.buyBtn, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markBought(w)}>↩️ 취소하기</button>
                    ) : w.status === 'available' ? (
                      <button style={styles.buyBtn} onClick={() => markBought(w)}>🛍️ 내가 살게요</button>
                    ) : null
                  )}
                  {w.user_id === session.user.id && (
                    w.status === 'received' ? (
                      <button style={{...styles.receivedBtn, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markReceived(w)}>↩️ 받음 취소</button>
                    ) : (
                      <button style={styles.receivedBtn} onClick={() => markReceived(w)}>✅ 받았어요</button>
                    )
                  )}
                  {w.user_id === session.user.id && (
                    <button style={styles.editBtn} onClick={() => openEdit(w)}>✏️</button>
                  )}
                  {w.user_id === session.user.id && (
                    <button style={styles.delBtn} onClick={() => deleteWish(w.id)}>🗑️</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={styles.fab} onClick={() => { resetForm(); setShowAdd(true) }}>+</button>

      {showAdd && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>🎁 위시리스트에 추가</div>
            <div style={styles.modeTabs}>
              <button style={{...styles.modeTab, ...(addMode==='link' ? styles.modeTabActive : {})}} onClick={() => setAddMode('link')}>🔗 링크로 추가</button>
              <button style={{...styles.modeTab, ...(addMode==='manual' ? styles.modeTabActive : {})}} onClick={() => setAddMode('manual')}>✏️ 직접 입력</button>
            </div>
            {addMode === 'link' && (
              <input style={styles.input} placeholder="상품 링크 (https://...)" value={wishUrl} onChange={e => setWishUrl(e.target.value)} type="url" />
            )}
            <input style={styles.input} placeholder="상품명 *" value={wishName} onChange={e => setWishName(e.target.value)} />
            <input style={styles.input} placeholder="가격 (숫자만)" value={wishPrice} onChange={e => setWishPrice(e.target.value)} type="number" />
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
            <button style={styles.btn} onClick={addWish}>🎁 추가하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowAdd(false); resetForm() }}>취소</button>
          </div>
        </div>
      )}

      {showEdit && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowEdit(false); resetForm() } }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>✏️ 위시 수정하기</div>
            <div style={styles.modeTabs}>
              <button style={{...styles.modeTab, ...(addMode==='link' ? styles.modeTabActive : {})}} onClick={() => setAddMode('link')}>🔗 링크로 추가</button>
              <button style={{...styles.modeTab, ...(addMode==='manual' ? styles.modeTabActive : {})}} onClick={() => setAddMode('manual')}>✏️ 직접 입력</button>
            </div>
            {addMode === 'link' && (
              <input style={styles.input} placeholder="상품 링크 (https://...)" value={wishUrl} onChange={e => setWishUrl(e.target.value)} type="url" />
            )}
            <input style={styles.input} placeholder="상품명 *" value={wishName} onChange={e => setWishName(e.target.value)} />
            <input style={styles.input} placeholder="가격 (숫자만)" value={wishPrice} onChange={e => setWishPrice(e.target.value)} type="number" />
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
            <button style={styles.btn} onClick={saveEdit}>💾 저장하기</button>
            <button style={styles.cancelBtn} onClick={() => { setShowEdit(false); resetForm() }}>취소</button>
          </div>
        </div>
      )}

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
    </div>
  )
}

const pCard: React.CSSProperties = { background:'white', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }
const pTitle: React.CSSProperties = { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'12px' }
const pRow: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', gap:'12px' }
const pLabel: React.CSSProperties = { fontSize:'13px', color:'#6B7280', flexShrink:0 }
const pVal: React.CSSProperties = { fontSize:'13px', color:'#111827', fontWeight:500, textAlign:'right' }

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#F9FAFB', fontFamily:'sans-serif' },
  topbar: { background:'white', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  shareBtn: { background:'white', border:'1.5px solid #E5E7EB', borderRadius:'50px', padding:'8px 16px', fontSize:'13px', cursor:'pointer' },
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
  wishThumb: { width:'64px', height:'64px', background:'#F3F4F6', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 },
  wishName: { fontSize:'14px', fontWeight:600, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  wishPrice: { fontSize:'15px', fontWeight:700, color:'#F472B6', marginBottom:'5px' },
  tagRow: { display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'6px' },
  tag: { fontSize:'11px', padding:'3px 8px', borderRadius:'50px', background:'#EDE9FE', color:'#A78BFA', fontWeight:500 },
  btnRow: { display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'6px' },
  linkBtn: { background:'#FCE7F3', color:'#F472B6', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  buyBtn: { background:'#D1FAE5', color:'#059669', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  receivedBtn: { background:'#EDE9FE', color:'#A78BFA', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  editBtn: { background:'#FEF3C7', color:'#92400E', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', cursor:'pointer' },
  delBtn: { background:'#F3F4F6', color:'#9CA3AF', border:'none', borderRadius:'50px', padding:'5px 12px', fontSize:'11px', cursor:'pointer' },
  fab: { position:'fixed', bottom:'24px', right:'20px', width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg, #F472B6, #A78BFA)', border:'none', cursor:'pointer', fontSize:'26px', color:'white', boxShadow:'0 4px 20px rgba(244,114,182,0.5)', zIndex:100 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 40px' },
  modalHandle: { width:'40px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' },
  modalTitle: { fontSize:'18px', fontWeight:700, marginBottom:'20px' },
  modeTabs: { display:'flex', marginBottom:'16px', borderRadius:'10px', overflow:'hidden', border:'1.5px solid #E5E7EB' },
  modeTab: { flex:1, padding:'10px', textAlign:'center', cursor:'pointer', fontSize:'13px', fontWeight:500, color:'#6B7280', background:'white', border:'none', fontFamily:'sans-serif' },
  modeTabActive: { background:'#F472B6', color:'white', fontWeight:700 },
  input: { width:'100%', padding:'13px 16px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif' },
  btn: { width:'100%', padding:'14px', background:'linear-gradient(135deg, #F472B6, #A78BFA)', color:'white', border:'none', borderRadius:'50px', fontSize:'15px', fontWeight:700, cursor:'pointer' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'8px' },
  inviteBox: { background:'#F9FAFB', borderRadius:'16px', padding:'24px', textAlign:'center', border:'2px dashed #E5E7EB', marginBottom:'16px' }
}