export type Language = 'ko' | 'en'

export const translations = {
  ko: {
    // 공통
    app_name: '위시픽',
    app_tagline: '받고 싶은 선물을 공유해요',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    close: '닫기',
    confirm: '확인',
    loading: '로딩 중...',
    saving: '저장 중...',
    
    // 인증
    login: '🔑 로그인',
    signup: '🎉 회원가입',
    logout: '로그아웃',
    email: '이메일',
    password: '비밀번호',
    name: '이름',
    have_account: '이미 계정이 있어요 → 로그인',
    no_account: '계정이 없어요 → 회원가입',
    
    // 홈
    greeting: '안녕하세요 👋',
    my_groups: '내 그룹',
    new_group: '새 그룹',
    join_group: '코드 참여',
    no_groups: '아직 그룹이 없어요',
    no_groups_desc: '새 그룹을 만들거나 초대 코드로 참여해보세요!',
    upcoming_events: '🔔 다가오는 이벤트',
    profile: '👤 프로필',
    notifications: '알림 설정',
    
    // 그룹
    create_group: '✨ 새 그룹 만들기',
    group_name: '그룹 이름',
    group_type: '그룹 종류',
    invite_code: '초대 코드',
    copy_code: '📋 탭해서 복사',
    share: '공유',
    invite_members: '👥 친구·파트너 초대',
    copy_invite: '📋 코드 복사하기',
    join_with_code: '📩 초대 코드로 참여',
    enter_code: 'ABC123',
    join: '참여하기',
    make: '만들기',
    group_types: {
      couple: '커플',
      family: '가족',
      friends: '친구',
      work: '직장',
      other: '기타'
    },
    
    // 위시리스트
    wishlist: '위시리스트',
    add_wish: '🎁 위시리스트에 추가',
    edit_wish: '✏️ 위시 수정하기',
    add_link: '🔗 링크로 추가',
    add_manual: '✏️ 직접 입력',
    product_link: '상품 링크 (https://...)',
    auto_detect: '🔍 자동 인식',
    product_name: '상품명 *',
    price: '가격 (예: 50,000)',
    shop: '파는 곳 (예: 쿠팡, 올리브영)',
    category: '카테고리',
    occasion: '이벤트',
    priority: '우선순위',
    color: '원하는 색상 (예: 아이보리)',
    size: '사이즈 (예: M, 240)',
    memo: '메모 (예: 50ml 사이즈로 부탁해요)',
    add_btn: '🎁 추가하기',
    save_btn: '💾 저장하기',
    price_unknown: '가격 미정',
    
    // 상태
    available: '구매 가능',
    bought: '구매 예정',
    received: '이미 받았어요',
    mark_bought: '🛍️ 내가 살게요',
    mark_received: '✅ 받았어요',
    cancel_bought: '↩️ 취소',
    cancel_received: '↩️ 취소',
    view_link: '🔗 보러가기',
    
    // 우선순위
    priority_high: '⭐ 꼭 받고 싶어요',
    priority_medium: '😊 받으면 좋아요',
    priority_low: '💭 언젠가 사고 싶어요',
    
    // 필터/정렬
    filter_all: '전체',
    filter_available: '구매 가능',
    filter_bought: '구매 예정',
    filter_received: '받은 것',
    sort_recent: '최근 추가순',
    sort_price_low: '가격 낮은순',
    sort_price_high: '가격 높은순',
    sort_priority: '우선순위순',
    sort_occasion: '이벤트순',
    
    // 이벤트
    anytime: '평소 위시리스트',
    event_mode_individual: '👤 개별 이벤트',
    event_mode_group: '🎉 공통 이벤트',
    
    // 비밀 댓글
    secret_comment: '🤫 비밀 댓글',
    secret_comment_placeholder: '비밀 댓글 입력...',
    send: '전송',
    no_comments: '아직 비밀 댓글이 없어요',
    
    // 감사 메시지
    thanks_title: '💝 감사 메시지',
    thanks_placeholder: '예: 고마워! 진짜 갖고 싶었던 거야 🥰',
    thanks_btn: '✅ 받았어요!',
    thanks_later: '나중에 할게요',
    
    // 프로필
    profile_title: '프로필 설정',
    basic_info: '👤 기본 정보',
    birthday: '생일 🎂',
    dday_settings: '🔔 D-day 알림 설정',
    my_events: '📅 내 이벤트',
    add_event: '+ 추가',
    preferences: '💝 취향 정보',
    size_info: '📏 사이즈 정보',
    gift_preferences: '🎁 선물 취향',
    unwanted: '이런 선물은 받고 싶지 않아요 🚫',
    
    // D-day
    d_day: 'D-DAY',
    wish_count: (n: number) => `위시 ${n}개`,
    no_wishes: '아직 위시리스트가 없어요',
  },
  
  en: {
    // Common
    app_name: 'WishPick',
    app_tagline: 'Share your gift wishlist',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    saving: 'Saving...',
    
    // Auth
    login: '🔑 Sign In',
    signup: '🎉 Sign Up',
    logout: 'Sign Out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    have_account: 'Already have an account → Sign In',
    no_account: "Don't have an account → Sign Up",
    
    // Home
    greeting: 'Hello 👋',
    my_groups: 'My Groups',
    new_group: 'New Group',
    join_group: 'Join',
    no_groups: 'No groups yet',
    no_groups_desc: 'Create a new group or join with an invite code!',
    upcoming_events: '🔔 Upcoming Events',
    profile: '👤 Profile',
    notifications: 'Notifications',
    
    // Group
    create_group: '✨ Create New Group',
    group_name: 'Group Name',
    group_type: 'Group Type',
    invite_code: 'Invite Code',
    copy_code: '📋 Tap to Copy',
    share: 'Share',
    invite_members: '👥 Invite Friends',
    copy_invite: '📋 Copy Code',
    join_with_code: '📩 Join with Invite Code',
    enter_code: 'ABC123',
    join: 'Join',
    make: 'Create',
    group_types: {
      couple: 'Couple',
      family: 'Family',
      friends: 'Friends',
      work: 'Work',
      other: 'Other'
    },
    
    // Wishlist
    wishlist: 'Wishlist',
    add_wish: '🎁 Add to Wishlist',
    edit_wish: '✏️ Edit Wish',
    add_link: '🔗 Add by Link',
    add_manual: '✏️ Manual Entry',
    product_link: 'Product URL (https://...)',
    auto_detect: '🔍 Auto Detect',
    product_name: 'Product Name *',
    price: 'Price',
    shop: 'Store (e.g. Amazon)',
    category: 'Category',
    occasion: 'Occasion',
    priority: 'Priority',
    color: 'Preferred Color',
    size: 'Size',
    memo: 'Notes',
    add_btn: '🎁 Add',
    save_btn: '💾 Save',
    price_unknown: 'Price unknown',
    
    // Status
    available: 'Available',
    bought: 'Someone is buying',
    received: 'Already received',
    mark_bought: "🛍️ I'll buy this",
    mark_received: '✅ Received',
    cancel_bought: '↩️ Cancel',
    cancel_received: '↩️ Cancel',
    view_link: '🔗 View',
    
    // Priority
    priority_high: '⭐ Must have',
    priority_medium: '😊 Would love it',
    priority_low: '💭 Someday',
    
    // Filter/Sort
    filter_all: 'All',
    filter_available: 'Available',
    filter_bought: 'Reserved',
    filter_received: 'Received',
    sort_recent: 'Recently Added',
    sort_price_low: 'Price: Low to High',
    sort_price_high: 'Price: High to Low',
    sort_priority: 'By Priority',
    sort_occasion: 'By Occasion',
    
    // Events
    anytime: 'Anytime',
    event_mode_individual: '👤 Individual Events',
    event_mode_group: '🎉 Group Event',
    
    // Secret comments
    secret_comment: '🤫 Secret Comment',
    secret_comment_placeholder: 'Write a secret comment...',
    send: 'Send',
    no_comments: 'No secret comments yet',
    
    // Thanks
    thanks_title: '💝 Thank You Message',
    thanks_placeholder: 'e.g. Thank you so much! 🥰',
    thanks_btn: '✅ Mark as Received!',
    thanks_later: 'Skip for now',
    
    // Profile
    profile_title: 'Profile Settings',
    basic_info: '👤 Basic Info',
    birthday: '🎂 Birthday',
    dday_settings: '🔔 D-day Alert Settings',
    my_events: '📅 My Events',
    add_event: '+ Add',
    preferences: '💝 Preferences',
    size_info: '📏 Size Info',
    gift_preferences: '🎁 Gift Preferences',
    unwanted: "Gifts I'd rather not receive 🚫",
    
    // D-day
    d_day: 'D-DAY',
    wish_count: (n: number) => `${n} wish${n !== 1 ? 'es' : ''}`,
    no_wishes: 'No wishes yet',
  }
}

export type TranslationKey = keyof typeof translations.ko