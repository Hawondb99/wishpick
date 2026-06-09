import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Group from './Group'
import Profile from './Profile'

export default function Home({ session }: { session: any }) {
  const [groups, setGroups] = useState<any[]>([])
  const [currentGroup, setCurrentGroup] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState('친구')
  const [newGroupVisibility, setNewGroupVisibility] = useState('surprise')
  const [joinCode, setJoinCode] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchGroups()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(data)
  }

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', session.user.id)
    if (data) setGroups(data.map((d: any) => d.groups).filter(Boolean))
    setLoading(false)
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) { alert('그룹 이름을 입력해주세요!'); return }
    const code = Math.random().toString(36).substr(2, 6).toUpperCase()
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: newGroupName.trim(),
        group_type: newGroupType,
        invite_code: code,
        created_by: session.user.id,
        buyer_visibility: newGroupVisibility
      })
      .select()
      .single()
    if (groupError) { alert('그룹 생성 오류: ' + groupError.message); return }
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: groupData.id, user_id: session.user.id })
    if (memberError) { alert('멤버 추가 오류: ' + memberError.message); return }
    setGroups(prev => [...prev, groupData])
    setShowCreate(false)
    setNewGroupName('')
    setNewGroupType('친구')
    setNewGroupVisibility('surprise')
    alert('🎉 그룹이 만들어졌어요!')
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) return
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', joinCode.toUpperCase())
      .single()
    if (!group) { alert('❌ 초대 코드를 찾을 수 없어요!'); return }
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: session.user.id })
    if (!memberError) {
      setGroups(prev => [...prev, group])
      setShowJoin(false)
      setJoinCode('')
      alert(`🎉 "${group.name}" 그룹에 참여했어요!`)
    } else {
      alert('이미 참여한 그룹이에요!')
    }
  }

  const groupTypeEmoji: Record<string, string> = {
    '커플': '💑', '가족': '👨‍👩‍👧', '친구': '🎂', '직장': '💼', '기타': '🎁'
  }

  const visibilityInfo: Record<string, { label: string, desc: string, emoji: string }> = {
    surprise: { label: '서프라이즈 모드', desc: '받는 사람에게 구매자가 보이지 않아요', emoji: '🎁' },
    public: { label: '모두 공개', desc: '그룹 멤버 모두 구매자를 볼 수 있어요', emoji: '👀' },
    private: { label: '완전 비공개', desc: '구매자 이름을 모두에게 숨겨요', emoji: '🔒' },
  }

  if (showProfile) {
    return <Profile session={session} onBack={() => { setShowProfile(false); fetchProfile() }} />
  }

  if (currentGroup) {
    return <Group group={currentGroup} session={session} onBack={() => { setCurrentGroup(null); fetchGroups() }} />
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>안녕하세요 👋</div>
          <div style={styles.username}>
            <span style={{ color: '#F472B6' }}>{profile?.name || '위시픽'}</span>님의 그룹
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={styles.profileBtn} onClick={() => setShowProfile(true)}>👤 프로필</button>
          <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={() => setShowCreate(true)}>
          <span style={{ fontSize: '24px' }}>✨</span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>새 그룹</span>
        </button>
        <button style={styles.actionBtn} onClick={() => setShowJoin(true)}>
          <span style={{ fontSize: '24px' }}>📩</span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>코드 참여</span>
        </button>
      </div>

      <div style={styles.sectionTitle}>🏠 내 그룹</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '24px' }}>🎁</div>
      ) : groups.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>아직 그룹이 없어요</div>
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>새 그룹을 만들거나 초대 코드로 참여해보세요!</div>
        </div>
      ) : (
        <div style={styles.groupList}>
          {groups.map(g => (
            <div key={g.id} style={styles.groupCard} onClick={() => setCurrentGroup(g)}>
              <div style={{ fontSize: '36px', marginRight: '12px' }}>
                {groupTypeEmoji[g.group_type] || '🎁'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{g.name}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>{g.group_type}</span>
                  <span>·</span>
                  <span>{visibilityInfo[g.buyer_visibility]?.emoji} {visibilityInfo[g.buyer_visibility]?.label}</span>
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#D1D5DB' }}>›</div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ ...styles.modal, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>✨ 새 그룹 만들기</div>
            <input style={styles.input} placeholder="그룹 이름 *" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <select style={styles.input} value={newGroupType} onChange={e => setNewGroupType(e.target.value)}>
              <option>커플</option>
              <option>가족</option>
              <option>친구</option>
              <option>직장</option>
              <option>기타</option>
            </select>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>👀 구매자 공개 설정</div>
              {Object.entries(visibilityInfo).map(([value, info]) => (
                <div key={value} onClick={() => setNewGroupVisibility(value)} style={{
                  padding: '12px 14px', marginBottom: '8px', borderRadius: '12px', cursor: 'pointer',
                  border: `1.5px solid ${newGroupVisibility === value ? '#F472B6' : '#E5E7EB'}`,
                  background: newGroupVisibility === value ? '#FDF2F8' : 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '18px' }}>{info.emoji}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: newGroupVisibility === value ? '#F472B6' : '#374151' }}>
                      {info.label}
                    </span>
                    {value === 'surprise' && (
                      <span style={{ fontSize: '10px', background: '#F472B6', color: 'white', padding: '2px 6px', borderRadius: '50px' }}>추천</span>
                    )}
                    {newGroupVisibility === value && <span style={{ marginLeft: 'auto', color: '#F472B6' }}>✅</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '26px' }}>{info.desc}</div>
                </div>
              ))}
            </div>
            <button style={styles.btn} onClick={createGroup}>만들기</button>
            <button style={styles.cancelBtn} onClick={() => setShowCreate(false)}>취소</button>
          </div>
        </div>
      )}

      {showJoin && (
        <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowJoin(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>📩 초대 코드로 참여</div>
            <input
              style={{ ...styles.input, textAlign: 'center', letterSpacing: '6px', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase' }}
              placeholder="ABC123"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button style={styles.btn} onClick={joinGroup}>참여하기</button>
            <button style={styles.cancelBtn} onClick={() => setShowJoin(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif' },
  header: {
    background: 'linear-gradient(135deg, #FDF2F8, #EDE9FE)',
    padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  greeting: { fontSize: '13px', color: '#6B7280', marginBottom: '4px' },
  username: { fontSize: '22px', fontWeight: 700, color: '#111827' },
  profileBtn: { background: 'linear-gradient(135deg, #F472B6, #A78BFA)', color: 'white', border: 'none', borderRadius: '50px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  logoutBtn: { background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' },
  actions: { display: 'flex', gap: '12px', padding: '20px' },
  actionBtn: {
    flex: 1, background: 'white', border: 'none', borderRadius: '16px',
    padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  sectionTitle: { fontSize: '15px', fontWeight: 700, padding: '0 20px 10px', color: '#111827' },
  empty: { textAlign: 'center', padding: '48px 24px', color: '#6B7280' },
  groupList: { padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '12px' },
  groupCard: {
    background: 'white', borderRadius: '16px', padding: '16px',
    display: 'flex', alignItems: 'center', cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200
  },
  modal: {
    background: 'white', borderRadius: '24px 24px 0 0', width: '100%',
    maxWidth: '480px', padding: '20px 20px 40px'
  },
  modalHandle: { width: '40px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 20px' },
  modalTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '20px' },
  input: {
    width: '100%', padding: '13px 16px', marginBottom: '12px',
    border: '1.5px solid #E5E7EB', borderRadius: '12px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif'
  },
  btn: {
    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #F472B6, #A78BFA)',
    color: 'white', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: 700, cursor: 'pointer'
  },
  cancelBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }
}