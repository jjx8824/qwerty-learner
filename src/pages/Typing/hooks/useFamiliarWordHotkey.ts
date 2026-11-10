import { TypingContext, TypingStateActionType } from '../store'
import { currentDictIdAtom, isReviewModeAtom } from '@/store'
import { addFamiliarWord, removeFamiliarWord } from '@/utils/db/familiar-words'
import { useAtomValue } from 'jotai'
import { useContext, useEffect, useRef } from 'react'

function isCtrlM(e: KeyboardEvent) {
  // 用 code 判断，避免部分环境下 Ctrl+M 被映射成 Enter（ASCII 回车）导致漏触发
  if (e.code !== 'KeyM' && e.key.toLowerCase() !== 'm') return false
  if (!e.ctrlKey || e.metaKey || e.altKey) return false
  return true
}

/**
 * Ctrl+M：将当前词标为熟词并立刻跳过（只添加，不切换）
 * Ctrl+Shift+M：取消当前词的熟词标记（不跳过）
 */
export function useFamiliarWordHotkey() {
  const { state, dispatch } = useContext(TypingContext) ?? {}
  const dictId = useAtomValue(currentDictIdAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)

  const refs = useRef({ state, dispatch, dictId, isReviewMode })
  refs.current = { state, dispatch, dictId, isReviewMode }

  const lastTriggerAtRef = useRef(0)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isCtrlM(e) || e.repeat) return

      const { state: currentState, dispatch: currentDispatch, dictId: currentDictId, isReviewMode: reviewing } = refs.current
      if (!currentState || !currentDispatch || reviewing) return

      const currentWord = currentState.chapterData.words[currentState.chapterData.index]
      if (!currentWord) return

      // 防止极短时间内重复触发（部分输入法 / 系统会打出两次 keydown）
      const now = Date.now()
      if (now - lastTriggerAtRef.current < 200) return
      lastTriggerAtRef.current = now

      e.preventDefault()
      e.stopImmediatePropagation()

      if (e.shiftKey) {
        // 取消熟词
        void removeFamiliarWord(currentDictId, currentWord.name)
        return
      }

      // 只做「标熟 + 跳过」，避免 toggle 时第一次变成取消、看起来像没生效
      currentDispatch({ type: TypingStateActionType.MARK_FAMILIAR_AND_SKIP })
      void addFamiliarWord(currentDictId, currentWord.name).catch(() => {
        // 错误已在 addFamiliarWord 内打印
      })
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
}
