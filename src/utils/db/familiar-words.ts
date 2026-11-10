import { db } from '.'
import { FamiliarWord } from './record'
import type { IFamiliarWord } from './record'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'

export async function getFamiliarWordsByDict(dict: string): Promise<IFamiliarWord[]> {
  return db.familiarWords.where('dict').equals(dict).toArray()
}

export async function getAllFamiliarWords(): Promise<IFamiliarWord[]> {
  // createTime 未建索引，不能 orderBy；先取出再按时间倒序
  const list = await db.familiarWords.toArray()
  return list.sort((a, b) => (b.createTime ?? 0) - (a.createTime ?? 0))
}

export async function addFamiliarWord(dict: string, word: string): Promise<void> {
  try {
    const existing = await db.familiarWords.where('[dict+word]').equals([dict, word]).first()
    if (existing) return
    await db.familiarWords.add(new FamiliarWord(dict, word))
  } catch (error) {
    console.error('添加熟词失败:', dict, word, error)
    throw error
  }
}

export async function removeFamiliarWord(dict: string, word: string): Promise<void> {
  try {
    await db.familiarWords.where('[dict+word]').equals([dict, word]).delete()
  } catch (error) {
    console.error('删除熟词失败:', dict, word, error)
    throw error
  }
}

export async function toggleFamiliarWord(dict: string, word: string): Promise<boolean> {
  const existing = await db.familiarWords.where('[dict+word]').equals([dict, word]).first()
  if (existing) {
    await removeFamiliarWord(dict, word)
    return false
  }
  await addFamiliarWord(dict, word)
  return true
}

export function useFamiliarWords(dict: string) {
  // undefined 表示仍在加载，避免与「空列表」混淆，防止练习中途标熟后整章被重新 SETUP
  const records = useLiveQuery(() => (dict ? getFamiliarWordsByDict(dict) : Promise.resolve([] as IFamiliarWord[])), [dict])

  const isReady = records !== undefined
  const familiarSet = useMemo(() => new Set((records ?? []).map((item) => item.word)), [records])

  const isFamiliar = useCallback((word: string) => familiarSet.has(word), [familiarSet])

  const markFamiliar = useCallback(
    async (word: string) => {
      await addFamiliarWord(dict, word)
    },
    [dict],
  )

  const unmarkFamiliar = useCallback(
    async (word: string) => {
      await removeFamiliarWord(dict, word)
    },
    [dict],
  )

  const toggleFamiliar = useCallback(
    async (word: string) => {
      return toggleFamiliarWord(dict, word)
    },
    [dict],
  )

  return {
    familiarSet,
    isReady,
    isFamiliar,
    markFamiliar,
    unmarkFamiliar,
    toggleFamiliar,
    count: familiarSet.size,
  }
}
