import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'
import { fetchProductFromUrl } from '../utils/fetchProduct'

const EVENT_TYPES_KO = ['생일', '결혼기념일', '연애기념일', '졸업', '입사/승진', '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스', '발렌타인데이', '화이트데이', '명절', '기타']
const EVENT_TYPES_EN = ['Birthday', 'Anniversary', 'Dating Anniversary', 'Graduation', 'Promotion', 'Wedding', 'Baby Shower', 'Housewarming', 'Christmas', "Valentine's Day", 'White Day', 'Holiday', 'Other']
const CATEGORIES_KO = ['패션','뷰티','전자기기','인테리어','취미','식품','생활용품','도서','육아','반려동물','여행','기타']
const CATEGORIES_EN = ['Fashion','Beauty','Electronics','Interior','Hobbies','Food','Household','Books','Baby','Pets','Travel','Other']
const OCCASIONS_KO = ['평소 위시리스트','생일','결혼기념일','연애기념일','베이비샤워','발렌타인데이','화이트데이','크리스마스','집들이','졸업','결혼','입사/승진','명절','기타']
const OCCASIONS_EN = ['Anytime','Birthday','Anniversary','Dating Anniversary','Baby Shower',"Valentine's Day",'White Day','Christmas','Housewarming','Graduation','Wedding','Promotion','Holiday','Other']
const GROUP_TYPES_KO = ['커플', '가족', '친구', '직장', '기타']
const GROUP_TYPES_EN = ['Couple', 'Family', 'Friends', 'Work', 'Other']
const THANKS_EMOJIS = ['💝', '🙏', '😊', '🥰', '💕', '✨', '🎉', '💖', '😍', '🌸']

const eventEmoji: Record<string, string> = {
  '생일': '🎂', 'Birthday': '🎂', '결혼기념일': '💑', 'Anniversary': '💑',
  '연애기념일': '💕', '졸업': '🎓', 'Graduation': '🎓', '입사/승진': '💼', 'Promotion': '💼',
  '결혼': '💍', 'Wedding': '💍', '베이비샤워': '👶', 'Baby Shower': '👶',
  '집들이': '🏠', 'Housewarming': '🏠', '크리스마스': '🎄', 'Christmas': '🎄',
  '발렌타인데이': '💝', "Valentine's Day": '💝', '화이트데이': '🤍', '명절': '🎆', '기타': '📅', 'Other': '📅'
}

export default function Group({ group: initialGroup, session, onBack }: { group: any, session: any, onBack: () => void }) {
  const { lang } = useLang()
  const [group, setGroup] = useState(initialGroup)
  const [wishes, setWishes] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSecretComments, setShowSecretComments] = useState<string | null>(null)
  const [showThanks, setShowThanks] = useState<any>(null)
  const [showSortFilter, setShowSortFilter] = useState(false)
  const [editingWish, setEditingWish] = useState<any>(null)
  const [filterMember, setFilterMember] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [addMode, setAddMode] = useState<'link'|'manual'>('link')
  const [loading, setLoading] = useState(true)
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [fetchingProduct, setFetchingProduct] = useState(false)
  const [productImageUrl, setProductImageUrl] = useState('')
  const [secretComments, setSecretComments] = useState<Record<string, any[]>>({})
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [thanksMessage, setThanksMessage] = useState('')
  const [thanksEmoji, setThanksEmoji] = useState('💝')
  const [wishName, setWishName] = useState('')
  const [wishPrice, setWishPrice] = useState('')
  const [wishShop, setWishShop] = useState('')
  const [wishUrl, setWishUrl] = useState('')
  const [wishCategory, setWishCategory] = useState(lang === 'ko' ? '기타' : 'Other')
  const [wishOccasion, setWishOccasion] = useState(lang === 'ko' ? '평소 위시리스트' : 'Anytime')
  const [wishPriority, setWishPriority] = useState('medium')
  const [wishMemo, setWishMemo] = useState('')
  const [wishColor, setWishColor] = useState('')
  const [wishSize, setWishSize] = useState('')
  const [settingName, setSettingName] = useState('')
  const [settingGroupType, setSettingGroupType] = useState('')
  const [settingCustomGroupType, setSettingCustomGroupType] = useState('')  // ✅ 컴포넌트 안으로 이동
  const [settingVisibility, setSettingVisibility] = useState('surprise')
  const [settingEventMode, setSettingEventMode] = useState('individual')
  const [settingEventType, setSettingEventType] = useState(lang === 'ko' ? '생일' : 'Birthday')
  const [settingEventTitle, setSettingEventTitle] = useState('')
  const [settingEventDate, setSettingEventDate] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const EVENT_TYPES = lang === 'ko' ? EVENT_TYPES_KO : EVENT_TYPES_EN
  const CATEGORIES = lang === 'ko' ? CATEGORIES_KO : CATEGORIES_EN
  const OCCASIONS = lang === 'ko' ? OCCASIONS_KO : OCCASIONS_EN
  const GROUP_TYPES = lang === 'ko' ? GROUP_TYPES_KO : GROUP_TYPES_EN

  const groupTypeToDisplay = (type: string) => {
    const koToEn: Record<string,string> = { '커플':'Couple','가족':'Family','친구':'Friends','직장':'Work','기타':'Other' }
    const enToKo: Record<string,string> = { 'Couple':'커플','Family':'가족','Friends':'친구','Work':'직장','Other':'기타' }
    if (lang === 'en') return koToEn[type] || type
    return enToKo[type] || type
  }

  const t = {
    share: lang === 'ko' ? '공유' : 'Share',
    inviteCode: lang === 'ko' ? '초대 코드' : 'Invite Code',
    tapCopy: lang === 'ko' ? '📋 탭해서 복사' : '📋 Tap to copy',
    all: lang === 'ko' ? '전체' : 'All',
    me: lang === 'ko' ? '나' : 'Me',
    available: lang === 'ko' ? '🛒 구매 가능' : '🛒 Available',
    reserved: lang === 'ko' ? '🛍️ 구매 예정' : '🛍️ Reserved',
    received: lang === 'ko' ? '✅ 받은 것' : '✅ Received',
    sortFilter: lang === 'ko' ? '정렬' : 'Sort',
    filterSummary: (n: number) => lang === 'ko' ? `${n}개 표시 중` : `${n} items`,
    reset: lang === 'ko' ? '초기화' : 'Reset',
    emptyTitle: lang === 'ko' ? '위시리스트가 비어있어요' : 'Wishlist is empty',
    emptyDesc: lang === 'ko' ? '+ 버튼을 눌러 추가해보세요!' : 'Tap + to add wishes!',
    addWish: lang === 'ko' ? '🎁 위시리스트에 추가' : '🎁 Add to Wishlist',
    editWish: lang === 'ko' ? '✏️ 위시 수정하기' : '✏️ Edit Wish',
    addByLink: lang === 'ko' ? '🔗 링크로 추가' : '🔗 Add by Link',
    addManual: lang === 'ko' ? '✏️ 직접 입력' : '✏️ Manual',
    productLink: lang === 'ko' ? '상품 링크 (https://...)' : 'Product URL (https://...)',
    autoDetect: lang === 'ko' ? '🔍 자동' : '🔍 Auto',
    productName: lang === 'ko' ? '상품명 *' : 'Product Name *',
    price: lang === 'ko' ? '가격 (예: 50,000)' : 'Price',
    store: lang === 'ko' ? '파는 곳 (예: 쿠팡)' : 'Store',
    color: lang === 'ko' ? '원하는 색상' : 'Preferred Color',
    size: lang === 'ko' ? '사이즈' : 'Size',
    memo: lang === 'ko' ? '메모' : 'Notes',
    addBtn: lang === 'ko' ? '🎁 추가하기' : '🎁 Add',
    saveBtn: lang === 'ko' ? '💾 저장하기' : '💾 Save',
    cancel: lang === 'ko' ? '취소' : 'Cancel',
    close: lang === 'ko' ? '닫기' : 'Close',
    priorityHigh: lang === 'ko' ? '⭐ 꼭 받고 싶어요' : '⭐ Must have',
    priorityMed: lang === 'ko' ? '😊 받으면 좋아요' : '😊 Would love it',
    priorityLow: lang === 'ko' ? '💭 언젠가 사고 싶어요' : '💭 Someday',
    iwillbuy: lang === 'ko' ? '🛍️ 살게요' : "🛍️ I'll buy",
    cancelBuy: lang === 'ko' ? '↩️ 취소' : '↩️ Cancel',
    markReceived: lang === 'ko' ? '✅ 받았어요' : '✅ Received',
    cancelReceived: lang === 'ko' ? '↩️ 취소' : '↩️ Cancel',
    viewLink: lang === 'ko' ? '🔗 보러가기' : '🔗 View',
    boughtByMe: lang === 'ko' ? '🛍️ 내가 구매 예정이에요' : "🛍️ I'm buying this",
    boughtBySomeone: lang === 'ko' ? '🛍️ 누군가 구매 예정이에요' : '🛍️ Someone is buying',
    boughtByName: (name: string) => lang === 'ko' ? `🛍️ ${name}가 구매 예정이에요` : `🛍️ ${name} is buying`,
    priceUnknown: lang === 'ko' ? '가격 미정' : 'Price unknown',
    wishOf: (name: string) => lang === 'ko' ? `${name}의 위시` : `${name}'s wish`,
    sortTitle: lang === 'ko' ? '⇅ 정렬 & 필터' : '⇅ Sort & Filter',
    sortRecent: lang === 'ko' ? '🕐 최근 추가순' : '🕐 Recently Added',
    sortPriceLow: lang === 'ko' ? '💰 가격 낮은순' : '💰 Price: Low to High',
    sortPriceHigh: lang === 'ko' ? '💎 가격 높은순' : '💎 Price: High to Low',
    sortPriority: lang === 'ko' ? '⭐ 우선순위순' : '⭐ By Priority',
    applyBtn: lang === 'ko' ? '적용하기' : 'Apply',
    inviteTitle: lang === 'ko' ? '👥 초대하기' : '👥 Invite',
    inviteDesc: lang === 'ko' ? '이 코드를 친구에게 알려주세요' : 'Share this code with friends',
    copyCode: lang === 'ko' ? '📋 코드 복사하기' : '📋 Copy Code',
    thanksTitle: lang === 'ko' ? '💝 감사 메시지' : '💝 Thank You Message',
    thanksDesc: lang === 'ko' ? '선물을 받은 소감을 남겨보세요!' : 'Leave a thank you message!',
    selectEmoji: lang === 'ko' ? '이모지 선택' : 'Select Emoji',
    thanksPlaceholder: lang === 'ko' ? '예: 고마워! 진짜 갖고 싶었던 거야 🥰' : 'e.g. Thank you so much! 🥰',
    thanksBtn: lang === 'ko' ? '✅ 받았어요!' : '✅ Mark as Received!',
    thanksLater: lang === 'ko' ? '나중에 할게요' : 'Skip for now',
    secretTitle: '🤫 ' + (lang === 'ko' ? '비밀 댓글' : 'Secret Comments'),
    secretDesc: (name: string) => lang === 'ko' ? `선물 주인(${name})은 볼 수 없어요` : `${name} can't see these`,
    noComments: lang === 'ko' ? '첫 번째 비밀 댓글을 남겨보세요! 🤫' : 'Be the first to comment! 🤫',
    commentPlaceholder: lang === 'ko' ? '비밀 댓글...' : 'Secret comment...',
    send: lang === 'ko' ? '전송' : 'Send',
    settingsTitle: lang === 'ko' ? '⚙️ 그룹 설정' : '⚙️ Group Settings',
    adminOnly: lang === 'ko' ? '그룹장만' : 'Admin only',
    basicInfo: lang === 'ko' ? '기본 정보' : 'Basic Info',
    groupName: lang === 'ko' ? '그룹 이름' : 'Group Name',
    groupType: lang === 'ko' ? '그룹 종류' : 'Group Type',
    customGroupTypePlaceholder: lang === 'ko' ? '그룹 종류 직접 입력 (예: 동아리)' : 'Enter custom type (e.g. Club)',
    eventSettings: lang === 'ko' ? '이벤트 설정' : 'Event Settings',
    individualEvent: lang === 'ko' ? '👤 개별' : '👤 Individual',
    individualDesc: lang === 'ko' ? '각자의 이벤트' : 'Each member\'s events',
    groupEvent: lang === 'ko' ? '🎉 공통' : '🎉 Group',
    groupDesc: lang === 'ko' ? '그룹 이벤트' : 'Group event',
    eventName: lang === 'ko' ? '이벤트 이름' : 'Event Name',
    buyerSettings: lang === 'ko' ? '구매자 공개 설정' : 'Buyer Visibility',
    surpriseLabel: lang === 'ko' ? '🎁 서프라이즈' : '🎁 Surprise',
    surpriseDesc: lang === 'ko' ? '받는 사람에게 숨겨요' : 'Hidden from recipient',
    publicLabel: lang === 'ko' ? '👀 공개' : '👀 Public',
    publicDesc: lang === 'ko' ? '모두 볼 수 있어요' : 'Everyone can see',
    privateLabel: lang === 'ko' ? '🔒 비공개' : '🔒 Private',
    privateDesc: lang === 'ko' ? '모두에게 숨겨요' : 'Hidden from everyone',
    saveSettings: lang === 'ko' ? '💾 저장하기' : '💾 Save Settings',
    saving: lang === 'ko' ? '저장 중...' : 'Saving...',
    deleteConfirm: lang === 'ko' ? '삭제할까요?' : 'Delete this wish?',
    commentDeleteConfirm: lang === 'ko' ? '댓글을 삭제할까요?' : 'Delete this comment?',
    categoryLabel: lang === 'ko' ? '카테고리' : 'Category',
    thanksMsg: lang === 'ko' ? '감사 메시지' : 'Thank you message',
    profileTitle: (name: string) => lang === 'ko' ? `${name}님의 프로필` : `${name}'s Profile`,
    noProfile: lang === 'ko' ? '아직 프로필을 작성하지 않았어요' : 'No profile yet',
    preferenceInfo: lang === 'ko' ? '💝 취향 정보' : '💝 Preferences',
    favBrands: lang === 'ko' ? '좋아하는 브랜드' : 'Favorite Brands',
    favColors: lang === 'ko' ? '좋아하는 색상' : 'Favorite Colors',
    scent: lang === 'ko' ? '선호하는 향' : 'Preferred Scent',
    skinType: lang === 'ko' ? '피부 타입' : 'Skin Type',
    noPreference: lang === 'ko' ? '아직 취향 정보가 없어요' : 'No preferences yet',
    sizeInfo: lang === 'ko' ? '📏 사이즈' : '📏 Size',
    clothesSize: lang === 'ko' ? '옷 사이즈' : 'Clothes Size',
    shoesSize: lang === 'ko' ? '신발 사이즈' : 'Shoes Size',
    giftLikes: lang === 'ko' ? '🎁 이런 선물을 좋아해요' : '🎁 Gift Preferences',
    giftDislikes: lang === 'ko' ? '🚫 이런 선물은 받고 싶지 않아요' : '🚫 Unwanted Gifts',
    fetchSuccess: lang === 'ko' ? '✅ 상품 정보를 불러왔어요!' : '✅ Product info loaded!',
    fetchFail: lang === 'ko' ? '직접 입력해주세요.' : 'Please enter manually.',
  }

  useEffect(() => { fetchMembers(); fetchWishes() }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from('group_members')
      .select('user_id, profiles(id, name, email, birthday, favorite_brands, favorite_colors, clothes_size, shoes_size, preferred_scent, skin_type, gift_preferences, unwanted_gifts)')
      .eq('group_id', group.id)
    if (data) setMembers(data.map((d: any) => d.profiles))
  }

  const fetchWishes = async () => {
    const { data } = await supabase.from('wishes').select('*').eq('group_id', group.id).order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  const fetchSecretComments = async (wishId: string) => {
    const { data } = await supabase.from('secret_memos').select('*, profiles(name)').eq('wish_id', wishId).order('created_at', { ascending: true })
    if (data) setSecretComments(prev => ({ ...prev, [wishId]: data }))
  }

  const openSecretComments = async (wishId: string) => {
    setShowSecretComments(wishId); setNewComment('')
    await fetchSecretComments(wishId)
  }

  const addSecretComment = async (wishId: string) => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const { error } = await supabase.from('secret_memos').insert({ wish_id: wishId, group_id: group.id, user_id: session.user.id, content: newComment.trim() })
    if (!error) { setNewComment(''); await fetchSecretComments(wishId) }
    setSubmittingComment(false)
  }

  const deleteSecretComment = async (commentId: string, wishId: string) => {
    if (!confirm(t.commentDeleteConfirm)) return
    await supabase.from('secret_memos').delete().eq('id', commentId)
    await fetchSecretComments(wishId)
  }

  const submitThanks = async (wish: any) => {
    const { error } = await supabase.from('wishes').update({ status: 'received', received_at: new Date().toISOString(), thanks_message: thanksMessage.trim() || null, thanks_emoji: thanksEmoji }).eq('id', wish.id)
    if (!error) { fetchWishes(); setShowThanks(null); setThanksMessage(''); setThanksEmoji('💝') }
  }

  const resetForm = () => {
    setWishName(''); setWishPrice(''); setWishShop(''); setWishUrl('')
    setWishCategory(lang === 'ko' ? '기타' : 'Other')
    setWishOccasion(lang === 'ko' ? '평소 위시리스트' : 'Anytime')
    setWishPriority('medium'); setWishMemo(''); setWishColor(''); setWishSize('')
    setProductImageUrl('')
  }

  const handleFetchProduct = async () => {
    if (!wishUrl.trim()) { alert(t.productLink); return }
    setFetchingProduct(true)
    try {
      const info = await fetchProductFromUrl(wishUrl)
      if (info.name) setWishName(info.name)
      if (info.price) setWishPrice(String(info.price))
      if (info.shop) setWishShop(info.shop)
      if (info.category) setWishCategory(info.category)
      if (info.memo) setWishMemo(info.memo)
      if (info.imageUrl) setProductImageUrl(info.imageUrl)
      alert(t.fetchSuccess)
    } catch (e) { alert(t.fetchFail) }
    setFetchingProduct(false)
  }

  const openEdit = (w: any) => {
    setEditingWish(w); setWishName(w.name || ''); setWishPrice(w.price ? String(w.price) : '')
    setWishShop(w.shop || ''); setWishUrl(w.url || '')
    setWishCategory(w.category || (lang === 'ko' ? '기타' : 'Other'))
    setWishOccasion(w.occasion || (lang === 'ko' ? '평소 위시리스트' : 'Anytime'))
    setWishPriority(w.priority || 'medium'); setWishMemo(w.memo || '')
    setWishColor(w.color || ''); setWishSize(w.size || '')
    setProductImageUrl(w.image_url || ''); setShowEdit(true)
  }

  const openSettings = () => {
    setSettingName(group.name || '')
    setSettingGroupType(group.group_type || (lang === 'ko' ? '친구' : 'Friends'))
    setSettingVisibility(group.buyer_visibility || 'surprise')
    setSettingEventMode(group.event_mode || 'individual')
    setSettingEventType(group.group_event_type || (lang === 'ko' ? '생일' : 'Birthday'))
    setSettingEventTitle(group.group_event_title || '')
    setSettingEventDate(group.group_event_date || '')
    setSettingCustomGroupType('')
    setShowSettings(true)
  }

  const saveSettings = async () => {
    if (!settingName.trim()) { alert(t.groupName); return }
    setSavingSettings(true)
    const finalGroupType = settingCustomGroupType.trim() || settingGroupType
    const { data, error } = await supabase.from('groups').update({
      name: settingName.trim(),
      group_type: finalGroupType,
      buyer_visibility: settingVisibility,
      event_mode: settingEventMode,
      group_event_type: settingEventMode === 'group' ? settingEventType : null,
      group_event_title: settingEventMode === 'group' ? (settingEventTitle || settingEventType) : null,
      group_event_date: settingEventMode === 'group' && settingEventType !== '생일' && settingEventType !== 'Birthday' ? settingEventDate : null,
    }).eq('id', group.id).select().single()
    setSavingSettings(false)
    if (!error && data) { setGroup(data); setShowSettings(false) }
    else alert('Error: ' + error?.message)
  }

  const addWish = async () => {
    if (!wishName.trim()) { alert(t.productName); return }
    const { error } = await supabase.from('wishes').insert({
      group_id: group.id, user_id: session.user.id, name: wishName,
      price: wishPrice ? parseInt(wishPrice) : null, shop: wishShop, url: wishUrl,
      image_url: productImageUrl, category: wishCategory, occasion: wishOccasion,
      priority: wishPriority, memo: wishMemo, color: wishColor, size: wishSize,
      buyer_visibility: group.buyer_visibility || 'surprise', status: 'available'
    })
    if (!error) { fetchWishes(); setShowAdd(false); resetForm() }
    else alert('Error: ' + error.message)
  }

  const saveEdit = async () => {
    if (!wishName.trim()) { alert(t.productName); return }
    const { error } = await supabase.from('wishes').update({
      name: wishName, price: wishPrice ? parseInt(wishPrice) : null,
      shop: wishShop, url: wishUrl, image_url: productImageUrl,
      category: wishCategory, occasion: wishOccasion, priority: wishPriority,
      memo: wishMemo, color: wishColor, size: wishSize,
    }).eq('id', editingWish.id)
    if (!error) { fetchWishes(); setShowEdit(false); setEditingWish(null); resetForm() }
    else alert('Error: ' + error.message)
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
      await supabase.from('wishes').update({ status: 'available', received_at: null, thanks_message: null, thanks_emoji: null }).eq('id', wish.id)
      fetchWishes()
    } else { setThanksMessage(''); setThanksEmoji('💝'); setShowThanks(wish) }
  }

  const deleteWish = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return
    await supabase.from('wishes').delete().eq('id', id)
    fetchWishes()
  }

  const copyCode = () => { navigator.clipboard.writeText(group.invite_code); alert('✅ ' + group.invite_code) }

  const getBuyerText = (w: any) => {
    if (w.status !== 'bought') return null
    const isOwner = w.user_id === session.user.id
    const isBuyer = w.bought_by === session.user.id
    const buyerName = members.find(m => m.id === w.bought_by)?.name || ''
    const visibility = group.buyer_visibility || 'surprise'
    if (isBuyer) return t.boughtByMe
    if (visibility === 'public') return t.boughtByName(buyerName)
    if (visibility === 'surprise') return isOwner ? t.boughtBySomeone : t.boughtByName(buyerName)
    return t.boughtBySomeone
  }

  const isGroupCreator = group.created_by === session.user.id

  const filteredWishes = wishes
    .filter(w => {
      if (filterMember !== 'all' && w.user_id !== filterMember) return false
      if (filterCategory !== 'all' && w.category !== filterCategory) return false
      if (filterStatus === 'available' && w.status !== 'available') return false
      if (filterStatus === 'bought' && w.status !== 'bought') return false
      if (filterStatus === 'received' && w.status !== 'received') return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0)
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1)
      }
      return 0
    })

  const categories = ['all', ...new Set(wishes.map(w => w.category))]
  const priorityLabel: Record<string, string> = { high: t.priorityHigh, medium: t.priorityMed, low: t.priorityLow }
  const priorityColor: Record<string, string> = { high:'#FEE2E2', medium:'#FEF3C7', low:'#F3F4F6' }
  const priorityTextColor: Record<string, string> = { high:'#991B1B', medium:'#92400E', low:'#374151' }
  const isFiltered = filterStatus !== 'all' || filterCategory !== 'all' || sortBy !== 'recent'

  // 기타/custom 타입 여부 판별
  const isCustomType = settingGroupType === '기타' || settingGroupType === 'Other'
    || (!GROUP_TYPES_KO.includes(settingGroupType) && !GROUP_TYPES_EN.includes(settingGroupType) && settingGroupType !== '')

  if (viewingProfile) {
    return (
      <div style={styles.container}>
        <div style={styles.topbar}>
          <button style={styles.backBtn} onClick={() => setViewingProfile(null)}>←</button>
          <div style={{fontWeight:700, fontSize:'17px'}}>{t.profileTitle(viewingProfile.name)}</div>
          <div style={{width:'32px'}} />
        </div>
        <div style={{padding:'16px 16px 100px'}}>
          {viewingProfile.birthday && (
            <div style={pCard}><div style={pTitle}>🎂 {lang === 'ko' ? '생일' : 'Birthday'}</div>
              <div style={{fontSize:'15px', fontWeight:600, color:'#374151'}}>{viewingProfile.birthday}</div>
            </div>
          )}
          <div style={pCard}>
            <div style={pTitle}>{t.preferenceInfo}</div>
            {viewingProfile.favorite_brands?.length > 0 && <div style={pRow}><span style={pLabel}>{t.favBrands}</span><span style={pVal}>{viewingProfile.favorite_brands.join(', ')}</span></div>}
            {viewingProfile.favorite_colors?.length > 0 && <div style={pRow}><span style={pLabel}>{t.favColors}</span><span style={pVal}>{viewingProfile.favorite_colors.join(', ')}</span></div>}
            {viewingProfile.preferred_scent && <div style={pRow}><span style={pLabel}>{t.scent}</span><span style={pVal}>{viewingProfile.preferred_scent}</span></div>}
            {viewingProfile.skin_type && <div style={pRow}><span style={pLabel}>{t.skinType}</span><span style={pVal}>{viewingProfile.skin_type}</span></div>}
            {!viewingProfile.favorite_brands?.length && !viewingProfile.favorite_colors?.length && <div style={{fontSize:'13px', color:'#9CA3AF'}}>{t.noPreference}</div>}
          </div>
          {(viewingProfile.clothes_size || viewingProfile.shoes_size) && (
            <div style={pCard}>
              <div style={pTitle}>{t.sizeInfo}</div>
              {viewingProfile.clothes_size && <div style={pRow}><span style={pLabel}>{t.clothesSize}</span><span style={pVal}>{viewingProfile.clothes_size}</span></div>}
              {viewingProfile.shoes_size && <div style={pRow}><span style={pLabel}>{t.shoesSize}</span><span style={pVal}>{viewingProfile.shoes_size}</span></div>}
            </div>
          )}
          {viewingProfile.gift_preferences && <div style={pCard}><div style={pTitle}>{t.giftLikes}</div><div style={{fontSize:'14px', color:'#374151', lineHeight:'1.6'}}>{viewingProfile.gift_preferences}</div></div>}
          {viewingProfile.unwanted_gifts && <div style={{...pCard, borderLeft:'3px solid #FCA5A5'}}><div style={{...pTitle, color:'#EF4444'}}>{t.giftDislikes}</div><div style={{fontSize:'14px', color:'#374151', lineHeight:'1.6'}}>{viewingProfile.unwanted_gifts}</div></div>}
          {!viewingProfile.favorite_brands?.length && !viewingProfile.gift_preferences && !viewingProfile.clothes_size && !viewingProfile.birthday && (
            <div style={{textAlign:'center', padding:'48px 24px', color:'#9CA3AF'}}>
              <div style={{fontSize:'48px', marginBottom:'12px'}}>👤</div>
              <div style={{fontWeight:600}}>{t.noProfile}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const wishFormContent = (
    <>
      <div style={styles.modeTabs}>
        <button style={{...styles.modeTab, ...(addMode==='link' ? styles.modeTabActive : {})}} onClick={() => setAddMode('link')}>{t.addByLink}</button>
        <button style={{...styles.modeTab, ...(addMode==='manual' ? styles.modeTabActive : {})}} onClick={() => setAddMode('manual')}>{t.addManual}</button>
      </div>
      {addMode === 'link' && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
            <input style={{...styles.input, marginBottom:0, flex:1}} placeholder={t.productLink} value={wishUrl} onChange={e => setWishUrl(e.target.value)} type="url" />
            <button style={{background: fetchingProduct ? '#E5E7EB' : '#111827', color: fetchingProduct ? '#9CA3AF' : 'white', border:'none', borderRadius:'10px', padding:'0 14px', fontSize:'12px', fontWeight:600, cursor: fetchingProduct ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', flexShrink:0}} onClick={handleFetchProduct} disabled={fetchingProduct}>
              {fetchingProduct ? '⏳' : t.autoDetect}
            </button>
          </div>
        </div>
      )}
      {productImageUrl && (
        <div style={{textAlign:'center', marginBottom:'12px'}}>
          <img src={productImageUrl} style={{width:'80px', height:'80px', objectFit:'cover', borderRadius:'12px', border:'1.5px solid #E5E7EB'}} onError={e => (e.currentTarget.style.display='none')} />
        </div>
      )}
      <input style={styles.input} placeholder={t.productName} value={wishName} onChange={e => setWishName(e.target.value)} />
      <input style={styles.input} placeholder={t.price} value={wishPrice ? Number(wishPrice.replace(/,/g, '')).toLocaleString() : ''} onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(raw)) setWishPrice(raw) }} type="text" inputMode="numeric" />
      <input style={styles.input} placeholder={t.store} value={wishShop} onChange={e => setWishShop(e.target.value)} />
      <select style={styles.input} value={wishCategory} onChange={e => setWishCategory(e.target.value)}>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <select style={styles.input} value={wishOccasion} onChange={e => setWishOccasion(e.target.value)}>
        {OCCASIONS.map(o => <option key={o}>{o}</option>)}
      </select>
      <select style={styles.input} value={wishPriority} onChange={e => setWishPriority(e.target.value)}>
        <option value="high">{t.priorityHigh}</option>
        <option value="medium">{t.priorityMed}</option>
        <option value="low">{t.priorityLow}</option>
      </select>
      <input style={styles.input} placeholder={t.color} value={wishColor} onChange={e => setWishColor(e.target.value)} />
      <input style={styles.input} placeholder={t.size} value={wishSize} onChange={e => setWishSize(e.target.value)} />
      <input style={styles.input} placeholder={t.memo} value={wishMemo} onChange={e => setWishMemo(e.target.value)} />
    </>
  )

  const currentWish = wishes.find(w => w.id === showSecretComments)
  const currentComments = showSecretComments ? (secretComments[showSecretComments] || []) : []

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px', flex:1, textAlign:'center', letterSpacing:'-0.3px'}}>{group.name}</div>
        <div style={{display:'flex', gap:'6px'}}>
          {isGroupCreator && <button style={styles.iconBtn} onClick={openSettings}>⚙️</button>}
          <button style={styles.shareBtn} onClick={() => setShowInvite(true)}>{t.share}</button>
        </div>
      </div>

      <div style={styles.hero}>
        <div style={{fontSize:'12px', color:'#9CA3AF', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>{t.inviteCode}</div>
        <div style={styles.codeBox} onClick={copyCode}>
          <span style={{fontSize:'20px', fontWeight:700, letterSpacing:'4px', color:'#111827'}}>{group.invite_code}</span>
          <span style={{fontSize:'11px', color:'#9CA3AF', marginLeft:'8px'}}>{t.tapCopy}</span>
        </div>
      </div>

      <div style={styles.tabsWrap}>
        <div style={styles.tabs}>
          <div style={{...styles.tab, ...(filterMember==='all' ? styles.tabActive : {})}} onClick={() => setFilterMember('all')}>{t.all}</div>
          {members.map(m => (
            <div key={m.id} style={{display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
              <div style={{...styles.tab, ...(filterMember===m.id ? styles.tabActive : {})}} onClick={() => setFilterMember(m.id)}>
                {m.id === session.user.id ? `${m.name} (${t.me})` : m.name}
              </div>
              {m.id !== session.user.id && (
                <button style={{...styles.tab, padding:'6px 8px', fontSize:'13px', background:'#F3F4F6', border:'none', color:'#6B7280', cursor:'pointer'}} onClick={() => setViewingProfile(m)}>👤</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={{display:'flex', gap:'6px', flex:1, overflowX:'auto'}}>
          {[
            { value: 'all', label: t.all },
            { value: 'available', label: t.available },
            { value: 'bought', label: t.reserved },
            { value: 'received', label: t.received },
          ].map(opt => (
            <div key={opt.value} style={{...styles.filterChip, ...(filterStatus === opt.value ? styles.filterActive : {})}} onClick={() => setFilterStatus(opt.value)}>
              {opt.label}
            </div>
          ))}
        </div>
        <button style={{...styles.sortBtn, background: isFiltered ? '#111827' : 'white', color: isFiltered ? 'white' : '#6B7280', border: `1.5px solid ${isFiltered ? '#111827' : '#E5E7EB'}`}} onClick={() => setShowSortFilter(true)}>
          {isFiltered ? '🔧' : '⇅'} {t.sortFilter}
        </button>
      </div>

      <div style={styles.categoryWrap}>
        {categories.map(c => (
          <div key={c} style={{...styles.categoryChip, ...(filterCategory===c ? styles.categoryActive : {})}} onClick={() => setFilterCategory(c)}>
            {c === 'all' ? t.all : c}
          </div>
        ))}
      </div>

      {isFiltered && (
        <div style={styles.filterSummary}>
          <span style={{fontSize:'12px', color:'#6B7280'}}>{t.filterSummary(filteredWishes.length)}</span>
          <button style={{fontSize:'11px', color:'#9CA3AF', background:'none', border:'none', cursor:'pointer'}} onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setSortBy('recent') }}>{t.reset}</button>
        </div>
      )}

      <div style={styles.wishList}>
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', fontSize:'24px'}}>🎁</div>
        ) : filteredWishes.length === 0 ? (
          <div style={styles.empty}>
            <div style={{fontSize:'40px', marginBottom:'12px'}}>🎀</div>
            <div style={{fontWeight:600, marginBottom:'6px', color:'#111827'}}>{t.emptyTitle}</div>
            <div style={{fontSize:'13px', color:'#9CA3AF'}}>{t.emptyDesc}</div>
          </div>
        ) : filteredWishes.map(w => (
          <div key={w.id} style={{...styles.wishCard, opacity: w.status==='received' ? 0.75 : 1}}>
            {w.status === 'received' && (
              <div style={{marginBottom:'8px'}}>
                <div style={styles.receivedBadge}>{t.received}</div>
                {w.thanks_message && (
                  <div style={{background:'#F9FAFB', borderRadius:'10px', padding:'10px 12px', marginTop:'8px', display:'flex', gap:'8px', alignItems:'flex-start'}}>
                    <span style={{fontSize:'18px', flexShrink:0}}>{w.thanks_emoji || '💝'}</span>
                    <div>
                      <div style={{fontSize:'10px', color:'#9CA3AF', marginBottom:'2px'}}>{t.thanksMsg}</div>
                      <div style={{fontSize:'13px', color:'#374151', lineHeight:'1.5'}}>{w.thanks_message}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {w.status === 'bought' && <div style={styles.boughtBadge}>{getBuyerText(w)}</div>}
            <div style={{display:'flex', gap:'12px', alignItems:'flex-start'}}>
              <div style={styles.wishThumb}>
                {w.image_url ? <img src={w.image_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} onError={e => { e.currentTarget.style.display='none' }} /> : '🎁'}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:'11px', color:'#9CA3AF', marginBottom:'3px', display:'flex', alignItems:'center', gap:'4px'}}>
                  <span>{t.wishOf(members.find(m => m.id === w.user_id)?.name || '')}</span>
                  {w.occasion && w.occasion !== '평소 위시리스트' && w.occasion !== 'Anytime' && <span style={{background:'#F3F4F6', color:'#6B7280', padding:'1px 6px', borderRadius:'50px', fontSize:'10px'}}>{w.occasion}</span>}
                </div>
                <div style={styles.wishName}>{w.name}</div>
                <div style={styles.wishPrice}>{w.price ? `${w.price.toLocaleString()}${lang === 'ko' ? '원' : ''}` : t.priceUnknown}</div>
                <div style={styles.tagRow}>
                  <span style={styles.tag}>{w.category}</span>
                  {w.shop && <span style={{...styles.tag, background:'#FFF7ED', color:'#C2410C'}}>{w.shop}</span>}
                  <span style={{...styles.tag, background: priorityColor[w.priority], color: priorityTextColor[w.priority], fontSize:'10px'}}>{priorityLabel[w.priority]}</span>
                </div>
                {w.memo && <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'4px'}}>💬 {w.memo}</div>}
                {(w.color || w.size) && <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'2px'}}>{w.color && `🎨 ${w.color}`}{w.size && ` 📏 ${w.size}`}</div>}
                <div style={styles.btnRow}>
                  {w.url && <button style={styles.linkBtn} onClick={() => window.open(w.url, '_blank')}>{t.viewLink}</button>}
                  {w.user_id !== session.user.id && w.status !== 'received' && (
                    w.status === 'bought' && w.bought_by === session.user.id
                      ? <button style={{...styles.actionBtnSmall, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markBought(w)}>{t.cancelBuy}</button>
                      : w.status === 'available' ? <button style={{...styles.actionBtnSmall, background:'#DCFCE7', color:'#16A34A'}} onClick={() => markBought(w)}>{t.iwillbuy}</button> : null
                  )}
                  {w.user_id === session.user.id && (
                    w.status === 'received'
                      ? <button style={{...styles.actionBtnSmall, background:'#FEE2E2', color:'#EF4444'}} onClick={() => markReceived(w)}>{t.cancelReceived}</button>
                      : <button style={{...styles.actionBtnSmall, background:'#EDE9FE', color:'#7C3AED'}} onClick={() => markReceived(w)}>{t.markReceived}</button>
                  )}
                  {w.user_id !== session.user.id && <button style={{...styles.actionBtnSmall, background:'#FEF9C3', color:'#A16207'}} onClick={() => openSecretComments(w.id)}>🤫</button>}
                  {w.user_id === session.user.id && <button style={{...styles.actionBtnSmall, background:'#F3F4F6', color:'#6B7280'}} onClick={() => openEdit(w)}>✏️</button>}
                  {w.user_id === session.user.id && <button style={{...styles.actionBtnSmall, background:'#F3F4F6', color:'#9CA3AF'}} onClick={() => deleteWish(w.id)}>🗑️</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={styles.fab} onClick={() => { resetForm(); setShowAdd(true) }}>+</button>

      {/* 정렬 모달 */}
      {showSortFilter && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowSortFilter(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.sortTitle}</div>
            <div style={modalSection}>
              <div style={modalSectionTitle}>{lang === 'ko' ? '정렬 기준' : 'Sort By'}</div>
              {[
                { value: 'recent', label: t.sortRecent },
                { value: 'price_low', label: t.sortPriceLow },
                { value: 'price_high', label: t.sortPriceHigh },
                { value: 'priority', label: t.sortPriority },
              ].map(opt => (
                <div key={opt.value} onClick={() => setSortBy(opt.value)} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', marginBottom:'6px', borderRadius:'12px', cursor:'pointer', border:`1.5px solid ${sortBy === opt.value ? '#111827' : '#E5E7EB'}`, background: sortBy === opt.value ? '#111827' : 'white'}}>
                  <span style={{fontSize:'14px', fontWeight:500, color: sortBy === opt.value ? 'white' : '#374151'}}>{opt.label}</span>
                  {sortBy === opt.value && <span style={{color:'white', fontSize:'16px'}}>✓</span>}
                </div>
              ))}
            </div>
            <div style={modalSection}>
              <div style={modalSectionTitle}>{t.categoryLabel}</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                {categories.map(c => (
                  <div key={c} onClick={() => setFilterCategory(c)} style={{padding:'7px 14px', borderRadius:'50px', cursor:'pointer', fontSize:'13px', border:`1.5px solid ${filterCategory === c ? '#111827' : '#E5E7EB'}`, background: filterCategory === c ? '#111827' : 'white', color: filterCategory === c ? 'white' : '#374151', fontWeight: filterCategory === c ? 600 : 400}}>
                    {c === 'all' ? t.all : c}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex', gap:'8px'}}>
              <button style={{...styles.btn, flex:1, background:'#F3F4F6', color:'#374151'}} onClick={() => { setSortBy('recent'); setFilterStatus('all'); setFilterCategory('all') }}>{t.reset}</button>
              <button style={{...styles.btn, flex:2}} onClick={() => setShowSortFilter(false)}>{t.applyBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* 위시 추가 모달 */}
      {showAdd && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.addWish}</div>
            {wishFormContent}
            <button style={styles.btn} onClick={addWish}>{t.addBtn}</button>
            <button style={styles.cancelBtn} onClick={() => { setShowAdd(false); resetForm() }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* 위시 수정 모달 */}
      {showEdit && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowEdit(false); resetForm() } }}>
          <div style={{...styles.modal, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.editWish}</div>
            {wishFormContent}
            <button style={styles.btn} onClick={saveEdit}>{t.saveBtn}</button>
            <button style={styles.cancelBtn} onClick={() => { setShowEdit(false); resetForm() }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* 초대 모달 */}
      {showInvite && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.inviteTitle}</div>
            <div style={{background:'#F9FAFB', borderRadius:'16px', padding:'24px', textAlign:'center', border:'2px dashed #E5E7EB', marginBottom:'16px'}}>
              <div style={{fontSize:'28px', fontWeight:700, letterSpacing:'8px', color:'#111827', marginBottom:'6px'}}>{group.invite_code}</div>
              <div style={{fontSize:'12px', color:'#9CA3AF'}}>{t.inviteDesc}</div>
            </div>
            <button style={styles.btn} onClick={copyCode}>{t.copyCode}</button>
            <button style={styles.cancelBtn} onClick={() => setShowInvite(false)}>{t.close}</button>
          </div>
        </div>
      )}

      {/* 감사 메시지 모달 */}
      {showThanks && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowThanks(null) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.thanksTitle}</div>
            <div style={{fontSize:'13px', color:'#9CA3AF', marginBottom:'16px'}}>{t.thanksDesc}</div>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px'}}>{t.selectEmoji}</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {THANKS_EMOJIS.map(emoji => (
                  <div key={emoji} onClick={() => setThanksEmoji(emoji)} style={{width:'40px', height:'40px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', cursor:'pointer', border:`2px solid ${thanksEmoji === emoji ? '#111827' : '#E5E7EB'}`, background: thanksEmoji === emoji ? '#111827' : 'white'}}>{emoji}</div>
                ))}
              </div>
            </div>
            <textarea style={{...styles.input, minHeight:'80px', resize:'vertical'}} placeholder={t.thanksPlaceholder} value={thanksMessage} onChange={e => setThanksMessage(e.target.value)} />
            <button style={styles.btn} onClick={() => submitThanks(showThanks)}>{t.thanksBtn}</button>
            <button style={styles.cancelBtn} onClick={() => setShowThanks(null)}>{t.thanksLater}</button>
          </div>
        </div>
      )}

      {/* 비밀 댓글 모달 */}
      {showSecretComments && currentWish && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowSecretComments(null) }}>
          <div style={{...styles.modal, maxHeight:'80vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={{marginBottom:'16px'}}>
              <div style={styles.modalTitle}>{t.secretTitle}</div>
              <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'4px'}}>{t.secretDesc(members.find(m => m.id === currentWish.user_id)?.name || '')}</div>
            </div>
            <div style={{background:'#F9FAFB', borderRadius:'12px', padding:'12px', marginBottom:'16px', display:'flex', gap:'10px', alignItems:'center'}}>
              <div style={{width:'36px', height:'36px', background:'#E5E7EB', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, overflow:'hidden'}}>
                {currentWish.image_url ? <img src={currentWish.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : '🎁'}
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:600, color:'#111827'}}>{currentWish.name}</div>
                <div style={{fontSize:'12px', color:'#9CA3AF'}}>{currentWish.price ? `${currentWish.price.toLocaleString()}${lang === 'ko' ? '원' : ''}` : t.priceUnknown}</div>
              </div>
            </div>
            <div style={{marginBottom:'16px', maxHeight:'250px', overflowY:'auto'}}>
              {currentComments.length === 0 ? (
                <div style={{textAlign:'center', padding:'20px', color:'#9CA3AF', fontSize:'13px'}}>{t.noComments}</div>
              ) : currentComments.map((c: any) => (
                <div key={c.id} style={{marginBottom:'8px', padding:'10px 12px', borderRadius:'10px', background: c.user_id === session.user.id ? '#F3F4F6' : '#FAFAFA', border:'1px solid #F3F4F6'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{fontSize:'12px', fontWeight:600, color:'#374151'}}>{c.profiles?.name} {c.user_id === session.user.id ? `(${t.me})` : ''}</span>
                    <div style={{display:'flex', gap:'8px'}}>
                      <span style={{fontSize:'10px', color:'#9CA3AF'}}>{new Date(c.created_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                      {c.user_id === session.user.id && <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#9CA3AF', padding:'0'}} onClick={() => deleteSecretComment(c.id, currentWish.id)}>🗑️</button>}
                    </div>
                  </div>
                  <div style={{fontSize:'13px', color:'#374151', lineHeight:'1.5'}}>{c.content}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex', gap:'8px'}}>
              <input style={{...styles.input, marginBottom:0, flex:1}} placeholder={t.commentPlaceholder} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !submittingComment && addSecretComment(currentWish.id)} />
              <button style={{background:'#111827', color:'white', border:'none', borderRadius:'10px', padding:'0 16px', fontSize:'13px', fontWeight:600, cursor:'pointer', flexShrink:0}} onClick={() => addSecretComment(currentWish.id)} disabled={submittingComment}>{submittingComment ? '...' : t.send}</button>
            </div>
            <button style={styles.cancelBtn} onClick={() => setShowSecretComments(null)}>{t.close}</button>
          </div>
        </div>
      )}

      {/* 그룹 설정 모달 */}
      {showSettings && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div style={{...styles.modal, maxHeight:'92vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
              <div style={styles.modalTitle}>{t.settingsTitle}</div>
              <span style={{fontSize:'11px', background:'#FEF9C3', color:'#A16207', padding:'3px 8px', borderRadius:'50px', fontWeight:600}}>{t.adminOnly}</span>
            </div>

            {/* 기본 정보 */}
            <div style={settingSection}>
              <div style={settingTitle}>{t.basicInfo}</div>
              <label style={settingLabel}>{t.groupName}</label>
              <input style={styles.input} placeholder={t.groupName} value={settingName} onChange={e => setSettingName(e.target.value)} />
              <label style={settingLabel}>{t.groupType}</label>

              {/* ✅ 그룹 타입 선택 칩 */}
              <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px'}}>
                {GROUP_TYPES.map(type => (
                  <div
                    key={type}
                    onClick={() => {
                      setSettingGroupType(type)
                      setSettingCustomGroupType('')
                    }}
                    style={{
                      padding:'7px 14px', borderRadius:'50px', cursor:'pointer', fontSize:'13px', fontWeight:500,
                      border:`1.5px solid ${settingGroupType === type || groupTypeToDisplay(settingGroupType) === type ? '#111827' : '#E5E7EB'}`,
                      background: settingGroupType === type || groupTypeToDisplay(settingGroupType) === type ? '#111827' : 'white',
                      color: settingGroupType === type || groupTypeToDisplay(settingGroupType) === type ? 'white' : '#374151'
                    }}
                  >{type}</div>
                ))}
              </div>

              {/* ✅ 기타 선택 시 직접 입력 input */}
              {isCustomType && (
                <input
                  style={{...styles.input, marginBottom:'4px'}}
                  placeholder={t.customGroupTypePlaceholder}
                  value={settingCustomGroupType}
                  onChange={e => {
                    setSettingCustomGroupType(e.target.value)
                  }}
                />
              )}
            </div>

            {/* 이벤트 설정 */}
            <div style={settingSection}>
              <div style={settingTitle}>{t.eventSettings}</div>
              <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                {[
                  {value:'individual', label:t.individualEvent, desc:t.individualDesc},
                  {value:'group', label:t.groupEvent, desc:t.groupDesc}
                ].map(opt => (
                  <div key={opt.value} onClick={() => setSettingEventMode(opt.value)} style={{flex:1, padding:'10px', borderRadius:'10px', cursor:'pointer', textAlign:'center', border:`1.5px solid ${settingEventMode===opt.value?'#111827':'#E5E7EB'}`, background:settingEventMode===opt.value?'#111827':'white'}}>
                    <div style={{fontSize:'13px', fontWeight:600, color:settingEventMode===opt.value?'white':'#374151'}}>{opt.label}</div>
                    <div style={{fontSize:'11px', color:settingEventMode===opt.value?'rgba(255,255,255,0.6)':'#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
                  </div>
                ))}
              </div>
              {settingEventMode === 'group' && (
                <>
                  <select style={styles.input} value={settingEventType} onChange={e => setSettingEventType(e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input style={styles.input} placeholder={t.eventName} value={settingEventTitle} onChange={e => setSettingEventTitle(e.target.value)} />
                  {settingEventType !== '생일' && settingEventType !== 'Birthday' && <input style={styles.input} type="date" value={settingEventDate} onChange={e => setSettingEventDate(e.target.value)} />}
                </>
              )}
            </div>

            {/* 구매자 설정 */}
            <div style={settingSection}>
              <div style={settingTitle}>{t.buyerSettings}</div>
              {[
                {value:'surprise', label:t.surpriseLabel, desc:t.surpriseDesc},
                {value:'public', label:t.publicLabel, desc:t.publicDesc},
                {value:'private', label:t.privateLabel, desc:t.privateDesc}
              ].map(opt => (
                <div key={opt.value} onClick={() => setSettingVisibility(opt.value)} style={{padding:'10px 12px', marginBottom:'6px', borderRadius:'10px', cursor:'pointer', border:`1.5px solid ${settingVisibility===opt.value?'#111827':'#E5E7EB'}`, background:settingVisibility===opt.value?'#111827':'white', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'13px', fontWeight:600, color:settingVisibility===opt.value?'white':'#374151'}}>{opt.label}</div>
                    <div style={{fontSize:'11px', color:settingVisibility===opt.value?'rgba(255,255,255,0.6)':'#9CA3AF', marginTop:'1px'}}>{opt.desc}</div>
                  </div>
                  {settingVisibility===opt.value && <span style={{color:'white'}}>✓</span>}
                </div>
              ))}
            </div>

            <button style={styles.btn} onClick={saveSettings} disabled={savingSettings}>{savingSettings ? t.saving : t.saveSettings}</button>
            <button style={styles.cancelBtn} onClick={() => setShowSettings(false)}>{t.cancel}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const pCard: React.CSSProperties = { background:'white', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }
const pTitle: React.CSSProperties = { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'12px' }
const pRow: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', gap:'12px' }
const pLabel: React.CSSProperties = { fontSize:'13px', color:'#6B7280', flexShrink:0 }
const pVal: React.CSSProperties = { fontSize:'13px', color:'#111827', fontWeight:500, textAlign:'right' }
const settingSection: React.CSSProperties = { background:'#F9FAFB', borderRadius:'12px', padding:'14px', marginBottom:'12px' }
const settingTitle: React.CSSProperties = { fontSize:'12px', fontWeight:700, color:'#6B7280', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.5px' }
const settingLabel: React.CSSProperties = { fontSize:'12px', fontWeight:600, color:'#6B7280', marginBottom:'8px', display:'block', textTransform:'uppercase', letterSpacing:'0.3px' }
const modalSection: React.CSSProperties = { marginBottom:'20px' }
const modalSectionTitle: React.CSSProperties = { fontSize:'12px', fontWeight:700, color:'#6B7280', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.5px' }

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#FAFAF9', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  topbar: { background:'white', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  iconBtn: { background:'#F3F4F6', border:'none', borderRadius:'50%', width:'34px', height:'34px', fontSize:'15px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  shareBtn: { background:'white', border:'1.5px solid #E5E7EB', borderRadius:'50px', padding:'7px 14px', fontSize:'13px', cursor:'pointer', fontWeight:500 },
  hero: { background:'white', padding:'16px 20px', textAlign:'center', borderBottom:'1px solid #F3F4F6' },
  codeBox: { display:'inline-flex', alignItems:'center', background:'#F9FAFB', borderRadius:'50px', padding:'10px 20px', cursor:'pointer', border:'1.5px solid #E5E7EB' },
  tabsWrap: { background:'white', borderBottom:'1px solid #F3F4F6', overflowX:'auto' },
  tabs: { display:'flex', padding:'10px 16px 0', gap:'6px', minWidth:'max-content' },
  tab: { padding:'7px 14px', borderRadius:'50px', fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', whiteSpace:'nowrap', marginBottom:'10px' },
  tabActive: { background:'#111827', borderColor:'#111827', color:'white' },
  filterBar: { display:'flex', padding:'10px 16px', gap:'8px', background:'white', borderBottom:'1px solid #F3F4F6', alignItems:'center' },
  filterChip: { padding:'6px 12px', borderRadius:'50px', fontSize:'12px', fontWeight:500, cursor:'pointer', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', whiteSpace:'nowrap', flexShrink:0 },
  filterActive: { background:'#111827', borderColor:'#111827', color:'white', fontWeight:700 },
  sortBtn: { padding:'6px 12px', borderRadius:'50px', fontSize:'12px', fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 },
  categoryWrap: { display:'flex', padding:'8px 16px', gap:'6px', overflowX:'auto', background:'#FAFAF9', borderBottom:'1px solid #F3F4F6' },
  categoryChip: { padding:'5px 12px', borderRadius:'50px', fontSize:'12px', cursor:'pointer', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', whiteSpace:'nowrap', flexShrink:0 },
  categoryActive: { background:'#F3F4F6', borderColor:'#D1D5DB', color:'#111827', fontWeight:600 },
  filterSummary: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 20px', background:'#F9FAFB' },
  wishList: { padding:'12px 16px 100px', display:'flex', flexDirection:'column', gap:'10px' },
  empty: { textAlign:'center', padding:'48px 24px', color:'#6B7280' },
  wishCard: { background:'white', borderRadius:'16px', padding:'14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', position:'relative' },
  receivedBadge: { background:'#DCFCE7', color:'#15803D', padding:'4px 10px', borderRadius:'50px', fontSize:'11px', fontWeight:700, display:'inline-block' },
  boughtBadge: { background:'#FEF9C3', color:'#A16207', padding:'4px 10px', borderRadius:'50px', fontSize:'11px', fontWeight:600, marginBottom:'8px', display:'inline-block' },
  wishThumb: { width:'60px', height:'60px', background:'#F3F4F6', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0, overflow:'hidden' },
  wishName: { fontSize:'14px', fontWeight:600, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111827' },
  wishPrice: { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'5px' },
  tagRow: { display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'6px' },
  tag: { fontSize:'11px', padding:'2px 8px', borderRadius:'50px', background:'#F3F4F6', color:'#6B7280', fontWeight:500 },
  btnRow: { display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'6px' },
  linkBtn: { background:'#F3F4F6', color:'#374151', border:'none', borderRadius:'50px', padding:'5px 10px', fontSize:'11px', fontWeight:500, cursor:'pointer' },
  actionBtnSmall: { border:'none', borderRadius:'50px', padding:'5px 10px', fontSize:'11px', fontWeight:600, cursor:'pointer' },
  fab: { position:'fixed', bottom:'24px', right:'20px', width:'52px', height:'52px', borderRadius:'50%', background:'#111827', border:'none', cursor:'pointer', fontSize:'24px', color:'white', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:100 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 40px' },
  modalHandle: { width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' },
  modalTitle: { fontSize:'18px', fontWeight:700, marginBottom:'20px', color:'#111827', letterSpacing:'-0.3px' },
  modeTabs: { display:'flex', marginBottom:'16px', borderRadius:'10px', overflow:'hidden', border:'1.5px solid #E5E7EB' },
  modeTab: { flex:1, padding:'10px', textAlign:'center', cursor:'pointer', fontSize:'13px', fontWeight:500, color:'#6B7280', background:'white', border:'none', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  modeTabActive: { background:'#111827', color:'white', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', background:'#FAFAF9', color:'#111827' },
  btn: { width:'100%', padding:'14px', background:'#111827', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:600, cursor:'pointer', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'4px' },
}