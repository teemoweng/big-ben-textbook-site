const ADJECTIVES = ['蓝色', '慵懒', '活泼', '快乐', '神秘', '勇敢', '温柔', '闪亮', '可爱', '聪明']
const ANIMALS = ['企鹅', '熊猫', '狐狸', '兔子', '猫咪', '小鸭', '仓鼠', '猫头鹰', '海豚', '松鼠']

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return adj + animal
}

export function getOrCreateIdentity(): { deviceId: string; nickname: string } {
  let deviceId = localStorage.getItem('bb_device_id')
  let nickname = localStorage.getItem('bb_nickname')

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('bb_device_id', deviceId)
  }
  if (!nickname) {
    nickname = generateNickname()
    localStorage.setItem('bb_nickname', nickname)
  }

  return { deviceId, nickname }
}
