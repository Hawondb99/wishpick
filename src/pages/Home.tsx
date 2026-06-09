import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Group from './Group';

export default function Home({ session }: { session: any }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('친구');
  const [joinCode, setJoinCode] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchGroups();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    setProfile(data);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', session.user.id);
    console.log('groups data:', data, 'error:', error);
    if (data) setGroups(data.map((d: any) => d.groups).filter(Boolean));
    setLoading(false);
  };

  const createGroup = async () => {
    console.log('createGroup 시작', newGroupName);
    if (!newGroupName.trim()) {
      alert('그룹 이름을 입력해주세요!');
      return;
    }

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    console.log('생성할 코드:', code);

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: newGroupName.trim(),
        group_type: newGroupType,
        invite_code: code,
        created_by: session.user.id,
      })
      .select()
      .single();

    console.log('그룹 생성 결과:', groupData, groupError);

    if (groupError) {
      alert('그룹 생성 오류: ' + groupError.message);
      return;
    }

    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: groupData.id,
      user_id: session.user.id,
    });

    console.log('멤버 추가 결과:', memberError);

    if (memberError) {
      alert('멤버 추가 오류: ' + memberError.message);
      return;
    }

    alert('🎉 그룹이 만들어졌어요!');
    setGroups((prev) => [...prev, groupData]);
    setShowCreate(false);
    setNewGroupName('');
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', joinCode.toUpperCase())
      .single();

    console.log('참여 그룹:', group, error);

    if (!group) {
      alert('❌ 초대 코드를 찾을 수 없어요!');
      return;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: session.user.id });

    if (!memberError) {
      setGroups((prev) => [...prev, group]);
      setShowJoin(false);
      setJoinCode('');
      alert(`🎉 "${group.name}" 그룹에 참여했어요!`);
    } else {
      alert('이미 참여한 그룹이에요!');
    }
  };

  const groupTypeEmoji: Record<string, string> = {
    커플: '💑',
    가족: '👨‍👩‍👧',
    친구: '🎂',
    직장: '💼',
    기타: '🎁',
  };

  if (currentGroup) {
    return (
      <Group
        group={currentGroup}
        session={session}
        onBack={() => {
          setCurrentGroup(null);
          fetchGroups();
        }}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>안녕하세요 👋</div>
          <div style={styles.username}>
            <span style={{ color: '#F472B6' }}>
              {profile?.name || '위시픽'}
            </span>
            님의 그룹
          </div>
        </div>
        <button
          style={styles.logoutBtn}
          onClick={() => supabase.auth.signOut()}
        >
          로그아웃
        </button>
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
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '24px' }}>
          🎁
        </div>
      ) : groups.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>
            아직 그룹이 없어요
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
            새 그룹을 만들거나 초대 코드로 참여해보세요!
          </div>
        </div>
      ) : (
        <div style={styles.groupList}>
          {groups.map((g) => (
            <div
              key={g.id}
              style={styles.groupCard}
              onClick={() => setCurrentGroup(g)}
            >
              <div style={{ fontSize: '36px', marginRight: '12px' }}>
                {groupTypeEmoji[g.group_type] || '🎁'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>
                  {g.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    marginTop: '2px',
                  }}
                >
                  {g.group_type}
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#D1D5DB' }}>›</div>
            </div>
          ))}
        </div>
      )}

      {/* 그룹 만들기 모달 */}
      {showCreate && (
        <div
          style={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>✨ 새 그룹 만들기</div>
            <input
              style={styles.input}
              placeholder="그룹 이름 *"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <select
              style={styles.input}
              value={newGroupType}
              onChange={(e) => setNewGroupType(e.target.value)}
            >
              <option>커플</option>
              <option>가족</option>
              <option>친구</option>
              <option>직장</option>
              <option>기타</option>
            </select>
            <button style={styles.btn} onClick={createGroup}>
              만들기
            </button>
            <button
              style={styles.cancelBtn}
              onClick={() => setShowCreate(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 코드로 참여 모달 */}
      {showJoin && (
        <div
          style={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowJoin(false);
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>📩 초대 코드로 참여</div>
            <input
              style={{
                ...styles.input,
                textAlign: 'center',
                letterSpacing: '6px',
                fontSize: '20px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button style={styles.btn} onClick={joinGroup}>
              참여하기
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowJoin(false)}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#F9FAFB',
    fontFamily: 'sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #FDF2F8, #EDE9FE)',
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: '13px', color: '#6B7280', marginBottom: '4px' },
  username: { fontSize: '22px', fontWeight: 700, color: '#111827' },
  logoutBtn: {
    background: 'white',
    border: '1.5px solid #E5E7EB',
    borderRadius: '50px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  actions: { display: 'flex', gap: '12px', padding: '20px' },
  actionBtn: {
    flex: 1,
    background: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    padding: '0 20px 10px',
    color: '#111827',
  },
  empty: { textAlign: 'center', padding: '48px 24px', color: '#6B7280' },
  groupList: {
    padding: '0 16px 100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  groupCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: 'white',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '480px',
    padding: '20px 20px 40px',
  },
  modalHandle: {
    width: '40px',
    height: '4px',
    background: '#E5E7EB',
    borderRadius: '2px',
    margin: '0 auto 20px',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '20px' },
  input: {
    width: '100%',
    padding: '13px 16px',
    marginBottom: '12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #F472B6, #A78BFA)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  cancelBtn: {
    width: '100%',
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
