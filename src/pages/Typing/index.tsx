import Layout from '../../components/Layout'
import { DictChapterButton } from './components/DictChapterButton'
import PronunciationSwitcher from './components/PronunciationSwitcher'
import ResultScreen from './components/ResultScreen'
import Speed from './components/Speed'
import StartButton from './components/StartButton'
import Switcher from './components/Switcher'
import WordList from './components/WordList'
import WordPanel from './components/WordPanel'
import { useConfetti } from './hooks/useConfetti'
import { useFamiliarWordHotkey } from './hooks/useFamiliarWordHotkey'
import { useWordList } from './hooks/useWordList'
import { TypingContext, TypingStateActionType, initialState, typingReducer } from './store'
import { DonateCard } from '@/components/DonateCard'
import Header from '@/components/Header'
import Tooltip from '@/components/Tooltip'
import { idDictionaryMap } from '@/resources/dictionary'
import {
  currentChapterAtom,
  currentDictIdAtom,
  isReviewModeAtom,
  randomConfigAtom,
  reviewModeInfoAtom,
  skipFamiliarWordsAtom,
} from '@/store'
import { IsDesktop, isLegal } from '@/utils'
import { useSaveChapterRecord } from '@/utils/db'
import { useMixPanelChapterLogUploader } from '@/utils/mixpanel'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useImmerReducer } from 'use-immer'

function FamiliarWordHotkeyBinder() {
  useFamiliarWordHotkey()
  return null
}

const App: React.FC = () => {
  const [state, dispatch] = useImmerReducer(typingReducer, structuredClone(initialState))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { words, isAllFamiliar, isLoading: isWordListLoading } = useWordList()

  const [currentDictId, setCurrentDictId] = useAtom(currentDictIdAtom)
  const currentChapter = useAtomValue(currentChapterAtom)
  const setCurrentChapter = useSetAtom(currentChapterAtom)
  const randomConfig = useAtomValue(randomConfigAtom)
  const skipFamiliarWords = useAtomValue(skipFamiliarWordsAtom)
  const chapterLogUploader = useMixPanelChapterLogUploader(state)
  const saveChapterRecord = useSaveChapterRecord()

  const reviewModeInfo = useAtomValue(reviewModeInfoAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)

  // 仅在词典 / 章节 / 复习 / 跳过熟词开关变化时重新装载章节，避免练习中途标熟触发整章重置
  const chapterSetupKey = useMemo(() => {
    if (isReviewMode) {
      return `review:${currentDictId}:${reviewModeInfo.reviewRecord?.id ?? 'new'}:${reviewModeInfo.reviewRecord?.createTime ?? 0}`
    }
    return `chapter:${currentDictId}:${currentChapter}:skip=${skipFamiliarWords}`
  }, [
    isReviewMode,
    currentDictId,
    reviewModeInfo.reviewRecord?.id,
    reviewModeInfo.reviewRecord?.createTime,
    currentChapter,
    skipFamiliarWords,
  ])

  useEffect(() => {
    // 检测用户设备
    if (!IsDesktop()) {
      setTimeout(() => {
        alert(
          ' Qwerty Learner 目的为提高键盘工作者的英语输入效率，目前暂未适配移动端，希望您使用桌面端浏览器访问。如您使用的是 Ipad 等平板电脑设备，可以使用外接键盘使用本软件。',
        )
      }, 500)
    }
  }, [])

  // 在组件挂载和currentDictId改变时，检查当前字典是否存在，如果不存在，则将其重置为默认值
  useEffect(() => {
    const id = currentDictId
    if (!(id in idDictionaryMap)) {
      setCurrentDictId('cet4')
      setCurrentChapter(0)
      return
    }
  }, [currentDictId, setCurrentChapter, setCurrentDictId])

  const skipWord = useCallback(() => {
    dispatch({ type: TypingStateActionType.SKIP_WORD })
  }, [dispatch])

  useEffect(() => {
    const onBlur = () => {
      dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
    }
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('blur', onBlur)
    }
  }, [dispatch])

  useEffect(() => {
    // 词表为空（全是熟词）不是加载中，否则会一直转圈
    setIsLoading(isWordListLoading)
  }, [isWordListLoading])

  useEffect(() => {
    if (!state.isTyping) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (
          !isLoading &&
          !state.isFinished &&
          state.chapterData.words.length > 0 &&
          e.key !== 'Enter' &&
          (isLegal(e.key) || e.key === ' ') &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey
        ) {
          e.preventDefault()
          dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: true })
        }
      }
      window.addEventListener('keydown', onKeyDown)

      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [state.isTyping, state.isFinished, state.chapterData.words.length, isLoading, dispatch])

  useEffect(() => {
    if (isWordListLoading) {
      return
    }

    // 开启跳过熟词且本章已全部为熟词：直接过关
    // 注意：不要把 isAllFamiliar 放进依赖。练习中途把最后一词标熟后它会变为 true，
    // 若因此重新 SETUP 会清空本章已产生的进度。
    if (isAllFamiliar) {
      dispatch({
        type: TypingStateActionType.SETUP_CHAPTER,
        payload: { words: [], shouldShuffle: false, initialIndex: 0 },
      })
      dispatch({ type: TypingStateActionType.SET_IS_FINISHED, payload: true })
      return
    }

    if (words !== undefined) {
      const initialIndex = isReviewMode && reviewModeInfo.reviewRecord?.index ? reviewModeInfo.reviewRecord.index : 0

      dispatch({
        type: TypingStateActionType.SETUP_CHAPTER,
        payload: { words, shouldShuffle: randomConfig.isOpen, initialIndex },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSetupKey, isWordListLoading])

  useEffect(() => {
    // 当用户完成章节后且完成 word Record 数据保存，记录 chapter Record 数据,
    if (state.isFinished && !state.isSavingRecord) {
      chapterLogUploader()
      saveChapterRecord(state)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isFinished, state.isSavingRecord])

  useEffect(() => {
    // 启动计时器
    let intervalId: number
    if (state.isTyping) {
      intervalId = window.setInterval(() => {
        dispatch({ type: TypingStateActionType.TICK_TIMER })
      }, 1000)
    }
    return () => clearInterval(intervalId)
  }, [state.isTyping, dispatch])

  useConfetti(state.isFinished)

  return (
    <TypingContext.Provider value={{ state: state, dispatch }}>
      <FamiliarWordHotkeyBinder />
      {state.isFinished && <DonateCard />}
      {state.isFinished && <ResultScreen />}
      <Layout>
        <Header>
          <DictChapterButton />
          <PronunciationSwitcher />
          <Switcher />
          <StartButton isLoading={isLoading || state.isFinished || state.chapterData.words.length === 0} />
          <Tooltip content="跳过该词">
            <button
              className={`${
                state.isShowSkip ? 'bg-orange-400' : 'invisible w-0 bg-gray-300 px-0 opacity-0'
              } my-btn-primary transition-all duration-300 `}
              onClick={skipWord}
            >
              Skip
            </button>
          </Tooltip>
        </Header>
        <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center pb-5">
          <div className="container relative mx-auto flex h-full flex-col items-center">
            <div className="container flex flex-grow items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center ">
                  <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid  border-indigo-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  ></div>
                </div>
              ) : (
                !state.isFinished && state.chapterData.words.length > 0 && <WordPanel />
              )}
            </div>
            <Speed />
          </div>
        </div>
      </Layout>
      <WordList />
    </TypingContext.Provider>
  )
}

export default App
