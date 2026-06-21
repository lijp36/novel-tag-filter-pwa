import Dexie, { type Table } from 'dexie'
import type { Novel, TagDef } from '@/types'

class NovelDatabase extends Dexie {
  novels!: Table<Novel, string>
  tagDefs!: Table<TagDef, string>

  constructor() {
    super('NovelTagFilterDB')
    this.version(2).stores({
      novels: 'id, fileName, importTime, *tagNames',
      tagDefs: 'id, name, enabled, order',
    })
  }
}

export const db = new NovelDatabase()

/** 预设标签库 */
export const DEFAULT_TAG_DEFS: TagDef[] = [
  {
    id: 'be',
    name: 'BE',
    description: '悲剧结局。主角死亡、牺牲、永远分离，或情感结局令人悲伤、遗憾',
    keywords: ['BE', '悲剧', '死', '牺牲', '永别', '双死', '同归于尽', '阴阳两隔'],
    enabled: true,
    order: 1,
  },
  {
    id: 'he',
    name: 'HE',
    description: '美好结局。主角克服困难最终幸福地在一起，结局圆满、温馨',
    keywords: ['HE', '幸福', '美满', '团圆', '圆满', '大结局', '在一起'],
    enabled: true,
    order: 2,
  },
  {
    id: 'hugong',
    name: '互攻',
    description: '双方互为攻受，不分上下位，感情和关系中地位对等',
    keywords: ['互攻', '互', '互宠'],
    enabled: true,
    order: 3,
  },
  {
    id: 'chuanyue',
    name: '穿越',
    description: '主角从原本时空穿越到另一个时代、世界或身体里',
    keywords: ['穿越', '穿到', '醒来发现', '穿越到', '身穿', '魂穿'],
    enabled: true,
    order: 4,
  },
  {
    id: 'zhongsheng',
    name: '重生',
    description: '主角死后或失败后回到过去某个时间点重新开始人生',
    keywords: ['重生', '回到过去', '重来', '再活一次', '前世'],
    enabled: true,
    order: 5,
  },
  {
    id: 'nuewen',
    name: '虐文',
    description: '故事中有大量虐心情节，情感冲突强烈，让读者感到心痛、难过',
    keywords: ['虐', '心痛', '虐心', '虐身', '虐恋', '泪目'],
    enabled: true,
    order: 6,
  },
  {
    id: 'tianchong',
    name: '甜宠',
    description: '故事温馨甜蜜，充满宠爱和呵护，没有虐心情节或极少',
    keywords: ['甜', '宠', '宠溺', '甜蜜', '甜文', '甜宠'],
    enabled: true,
    order: 7,
  },
  {
    id: 'gufeng',
    name: '古风',
    description: '故事背景设定在古代，含古风元素、古代服饰、礼仪等',
    keywords: ['古风', '古代', '皇上', '王爷', '将军', '江湖', '武林'],
    enabled: true,
    order: 8,
  },
  {
    id: 'xiandai',
    name: '现代',
    description: '故事背景设定在现代都市，含现代科技、生活方式',
    keywords: ['现代', '都市', '公司', 'CEO', '总裁', '校园', '现代'],
    enabled: true,
    order: 9,
  },
  {
    id: 'xuanhuan',
    name: '玄幻',
    description: '包含 fantasy 元素：魔法、灵力、修炼、异世界、神魔等',
    keywords: ['玄幻', '魔法', '灵力', '修仙', '修炼', '境界', '异世界'],
    enabled: true,
    order: 10,
  },
  {
    id: 'baihe',
    name: '百合',
    description: '女性角色之间的恋爱关系，主角均为女性',
    keywords: ['百合', 'GL', '女女', '女子'],
    enabled: true,
    order: 11,
  },
  {
    id: 'danmei',
    name: '耽美',
    description: '男性角色之间的恋爱关系，主角均为男性',
    keywords: ['耽美', 'BL', '男男', '男子'],
    enabled: true,
    order: 12,
  },
  {
    id: 'xiaoyuan',
    name: '校园',
    description: '故事背景主要在学校，主角为学生或老师',
    keywords: ['校园', '学校', '同学', '老师', '学生', '大学'],
    enabled: true,
    order: 13,
  },
  {
    id: 'zhichang',
    name: '职场',
    description: '故事背景在职场，主角为上班族，涉及工作、办公室情节',
    keywords: ['职场', '公司', '办公室', '同事', '上司', '工作'],
    enabled: true,
    order: 14,
  },
  {
    id: 'gongdou',
    name: '宫斗',
    description: '宫廷中的权力争斗、妃嫔之间的明争暗斗',
    keywords: ['宫斗', '后宫', '妃', '皇上', '娘娘', '争宠'],
    enabled: true,
    order: 15,
  },
  {
    id: 'quanmou',
    name: '权谋',
    description: '政治权谋、计策、权力斗争、朝堂博弈',
    keywords: ['权谋', '计谋', '朝堂', '谋略', '权术', '夺权'],
    enabled: true,
    order: 16,
  },
  {
    id: 'xiuxian',
    name: '修仙',
    description: '修真、修炼成仙、渡劫、飞升等修仙题材',
    keywords: ['修仙', '修真', '修炼', '渡劫', '飞升', '灵根', '筑基'],
    enabled: true,
    order: 17,
  },
  {
    id: 'xitong',
    name: '系统',
    description: '主角拥有系统辅助功能，如任务系统、兑换系统、签到系统等',
    keywords: ['系统', '签到', '系统提示', '任务', '抽奖'],
    enabled: true,
    order: 18,
  },
  {
    id: 'kuaichuan',
    name: '快穿',
    description: '主角穿越多个不同世界完成任务，每个世界开启新篇章',
    keywords: ['快穿', '位面', '穿梭', '攻略', '任务世界'],
    enabled: true,
    order: 19,
  },
  {
    id: 'niandai',
    name: '年代',
    description: '故事设定在特定历史年代，如八九十年代、民国、知青时期等',
    keywords: ['年代', '年代文', '八零', '九零', '七零', '重生', '年代'],
    enabled: true,
    order: 20,
  },
]

/** 初始化预设标签（首次使用时调用） */
export async function initDefaultTagDefs(): Promise<void> {
  const count = await db.tagDefs.count()
  if (count > 0) return // 已有数据，不覆盖
  await db.tagDefs.bulkAdd(DEFAULT_TAG_DEFS)
}
