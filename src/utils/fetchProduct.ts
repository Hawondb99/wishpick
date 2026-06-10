export interface ProductInfo {
    name: string
    price: number | null
    shop: string
    url: string
    imageUrl: string
    category: string
    memo: string
  }
  
  function detectShopFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      const shopMap: Record<string, string> = {
        'coupang.com': '쿠팡',
        'shopping.naver.com': '네이버쇼핑',
        'smartstore.naver.com': '네이버스마트스토어',
        'musinsa.com': '무신사',
        'oliveyoung.co.kr': '올리브영',
        'apple.com': '애플스토어',
        'nike.com': '나이키',
        'adidas.co.kr': '아디다스',
        'samsung.com': '삼성',
        'lge.co.kr': 'LG전자',
        'ssg.com': 'SSG',
        'gmarket.co.kr': 'G마켓',
        '11st.co.kr': '11번가',
        'auction.co.kr': '옥션',
        'kakao.com': '카카오',
        'gift.kakao.com': '카카오선물하기',
        'kurly.com': '마켓컬리',
        'baemin.com': '배달의민족',
        '29cm.co.kr': '29CM',
        'ably.team': '에이블리',
        'zigzag.kr': '지그재그',
      }
      for (const [key, value] of Object.entries(shopMap)) {
        if (domain.includes(key)) return value
      }
      return domain
    } catch {
      return ''
    }
  }
  
  export async function fetchProductFromUrl(url: string): Promise<ProductInfo> {
    const shop = detectShopFromUrl(url)
  
    const prompt = `다음 쇼핑몰 상품 URL의 실제 상품 정보를 웹에서 검색해서 찾아주세요.
  
  URL: ${url}
  판매처: ${shop}
  
  웹 검색으로 이 URL의 실제 상품 페이지를 방문하거나 검색해서 아래 정보를 찾아주세요:
  - 정확한 상품명
  - 판매 가격 (숫자만, 원화 기준)
  - 상품 대표 이미지 URL
  - 카테고리 분류
  
  반드시 아래 JSON 형식으로만 답변해주세요 (다른 텍스트 없이):
  {
    "name": "정확한 상품명",
    "price": 숫자만(예: 59000),
    "shop": "${shop}",
    "imageUrl": "상품 이미지 URL",
    "category": "패션/뷰티/전자기기/인테리어/취미/식품/생활용품/도서/육아/반려동물/여행/기타 중 정확히 하나",
    "memo": "상품 주요 특징 한 줄 (색상, 사이즈 옵션 등)"
  }
  
  카테고리 분류 기준:
  - 옷, 신발, 가방, 액세서리 → 패션
  - 화장품, 향수, 스킨케어, 헤어 → 뷰티
  - 폰, 노트북, 이어폰, 가전 → 전자기기
  - 가구, 조명, 인테리어소품 → 인테리어
  - 운동, 스포츠, 취미용품 → 취미
  - 음식, 음료, 건강식품 → 식품
  - 청소용품, 주방용품, 생활소품 → 생활용품
  - 책 → 도서
  - 아기용품, 육아 → 육아
  - 반려동물 용품 → 반려동물
  - 여행 → 여행
  - 그 외 → 기타`
  
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: prompt }]
        })
      })
  
      const data = await response.json()
  
      // 모든 텍스트 블록 합치기
      const text = data.content
        ?.filter((c: any) => c.type === 'text')
        ?.map((c: any) => c.text)
        ?.join('') || ''
  
      // JSON 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON not found')
  
      const json = JSON.parse(jsonMatch[0])
  
      // 가격 정리 (문자열이면 숫자로 변환)
      let price = null
      if (json.price) {
        const priceStr = String(json.price).replace(/[^0-9]/g, '')
        price = priceStr ? parseInt(priceStr) : null
      }
  
      return {
        name: json.name || '',
        price,
        shop: json.shop || shop,
        url,
        imageUrl: json.imageUrl || '',
        category: json.category || '기타',
        memo: json.memo || ''
      }
    } catch (e) {
      console.error('상품 정보 불러오기 실패:', e)
      return {
        name: '', price: null,
        shop,
        url, imageUrl: '', category: '기타', memo: ''
      }
    }
  }