import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

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

  useEffect(() => {
    fetchProfile()
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
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
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
      })
    setSaving(false)
    if (!error) {
      alert('✅ 프로필이 저장됐어요!')
      onBack()
    } else {
      alert('오류: ' + error.message)
    }
  }

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
          </div>
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
            <input style={styles.input} placeholder="예: 아이보리, 연핑크, 블랙 (쉼표로 구분)" value={favoriteColors} onChange={e => setFavoriteColors(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>선호하는 향</label>
            <input style={styles.input} placeholder="예: 은은한 플로럴, 시트러스" value={preferredScent} onChange={e => setPreferredScent(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>피부 타입</label>
            <select style={styles.input} value={skinType} onChange={e => setSkinType(e.target.value)}>
              <option value="">선택 안함</option>
              <option>건성</option>
              <option>지성</option>
              <option>복합성</option>
              <option>민감성</option>
              <option>중성</option>
            </select>
          </div>
        </div>

        {/* 사이즈 정보 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📏 사이즈 정보</div>
          <div style={styles.fieldRow}>
            <div style={{...styles.field, flex:1}}>
              <label style={styles.label}>옷 사이즈</label>
              <select style={styles.input} value={clothesSize} onChange={e => setClothesSize(e.target.value)}>
                <option value="">선택</option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>XXL</option>
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
            <textarea
              style={{...styles.input, minHeight:'80px', resize:'vertical'}}
              placeholder="예: 실용적인 선물을 좋아해요. 인테리어 소품도 좋아요."
              value={giftPreferences}
              onChange={e => setGiftPreferences(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>이런 선물은 받고 싶지 않아요 🚫</label>
            <textarea
              style={{...styles.input, minHeight:'80px', resize:'vertical'}}
              placeholder="예: 향초는 이미 많아요. 피부가 예민해서 화장품은 피해주세요."
              value={unwantedGifts}
              onChange={e => setUnwantedGifts(e.target.value)}
            />
          </div>
        </div>

        <button style={styles.saveFullBtn} onClick={saveProfile} disabled={saving}>
          {saving ? '저장 중...' : '💾 프로필 저장하기'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#F9FAFB', fontFamily:'sans-serif' },
  topbar: {
    background:'white', padding:'14px 20px',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50
  },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  saveBtn: {
    background:'linear-gradient(135deg, #F472B6, #A78BFA)',
    color:'white', border:'none', borderRadius:'50px',
    padding:'8px 18px', fontSize:'13px', fontWeight:700, cursor:'pointer'
  },
  content: { padding:'16px 16px 100px' },
  section: {
    background:'white', borderRadius:'16px', padding:'16px',
    marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)'
  },
  sectionTitle: { fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'14px' },
  field: { marginBottom:'12px' },
  fieldRow: { display:'flex', gap:'12px' },
  label: { fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px', display:'block' },
  input: {
    width:'100%', padding:'11px 14px',
    border:'1.5px solid #E5E7EB', borderRadius:'10px',
    fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif',
    background:'white'
  },
  saveFullBtn: {
    width:'100%', padding:'14px',
    background:'linear-gradient(135deg, #F472B6, #A78BFA)',
    color:'white', border:'none', borderRadius:'50px',
    fontSize:'15px', fontWeight:700, cursor:'pointer',
    marginTop:'8px'
  }
}