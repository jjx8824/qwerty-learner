import type { TypingState, UserInputLog } from './type'
import type { WordWithIndex } from '@/typings'
import type { LetterMistakes } from '@/utils/db/record'
import '@/utils/db/review-record'
import { mergeLetterMistake } from '@/utils/db/utils'
import shuffle from '@/utils/shuffle'
import { createContext } from 'react'

export const initialState: TypingState = {
  chapterData: {
    words: [],
    index: 0,
    wordCount: 0,
    correctCount: 0,
    wrongCount: 0,
    wordRecordIds: [],
    userInputLogs: [],
  },
  timerData: {
    time: 0,
    accuracy: 0,
    wpm: 0,
  },
  isTyping: false,
  isFinished: false,
  isShowSkip: false,
  isTransVisible: true,
  isLoopSingleWord: false,
  isSavingRecord: false,
}

export const initialUserInputLog: UserInputLog = {
  index: 0,
  correctCount: 0,
  wrongCount: 0,
  LetterMistakes: {},
}

export enum TypingStateActionType {
  SETUP_CHAPTER = 'SETUP_CHAPTER',
  SET_IS_SKIP = 'SET_IS_SKIP',
  SET_IS_TYPING = 'SET_IS_TYPING',
  TOGGLE_IS_TYPING = 'TOGGLE_IS_TYPING',
  REPORT_WRONG_WORD = 'REPORT_WRONG_WORD',
  REPORT_CORRECT_WORD = 'REPORT_CORRECT_WORD',
  NEXT_WORD = 'NEXT_WORD',
  LOOP_CURRENT_WORD = 'LOOP_CURRENT_WORD',
  FINISH_CHAPTER = 'FINISH_CHAPTER',
  INCREASE_WRONG_WORD = 'INCREASE_WRONG_WORD',
  SKIP_WORD = 'SKIP_WORD',
  SKIP_2_WORD_INDEX = 'SKIP_2_WORD_INDEX',
  REPEAT_CHAPTER = 'REPEAT_CHAPTER',
  NEXT_CHAPTER = 'NEXT_CHAPTER',
  TOGGLE_WORD_VISIBLE = 'TOGGLE_WORD_VISIBLE',
  TOGGLE_TRANS_VISIBLE = 'TOGGLE_TRANS_VISIBLE',
  TICK_TIMER = 'TICK_TIMER',
  ADD_WORD_RECORD_ID = 'ADD_WORD_RECORD_ID',
  SET_IS_SAVING_RECORD = 'SET_IS_SAVING_RECORD',
  SET_IS_LOOP_SINGLE_WORD = 'SET_IS_LOOP_SINGLE_WORD',
  TOGGLE_IS_LOOP_SINGLE_WORD = 'TOGGLE_IS_LOOP_SINGLE_WORD',
  SET_REVISION_INDEX = 'SET_REVISION_INDEX',
  /** 将当前词标为熟词后从本章练习列表移除并进入下一词 */
  MARK_FAMILIAR_AND_SKIP = 'MARK_FAMILIAR_AND_SKIP',
  /** 从本章练习列表移除指定单词（用于词表中标记非当前熟词） */
  REMOVE_WORD_BY_NAME = 'REMOVE_WORD_BY_NAME',
  /** 将单词重新加入本章练习列表（取消熟词标记时） */
  ADD_WORD_TO_CHAPTER = 'ADD_WORD_TO_CHAPTER',
  /** 将本章标记为已完成（例如进入章节时已全部为熟词） */
  SET_IS_FINISHED = 'SET_IS_FINISHED',
}

export type TypingStateAction =
  | { type: TypingStateActionType.SETUP_CHAPTER; payload: { words: WordWithIndex[]; shouldShuffle: boolean; initialIndex?: number } }
  | { type: TypingStateActionType.SET_IS_SKIP; payload: boolean }
  | { type: TypingStateActionType.SET_IS_TYPING; payload: boolean }
  | { type: TypingStateActionType.TOGGLE_IS_TYPING }
  | { type: TypingStateActionType.REPORT_WRONG_WORD; payload: { letterMistake: LetterMistakes } }
  | { type: TypingStateActionType.REPORT_CORRECT_WORD }
  | {
      type: TypingStateActionType.NEXT_WORD
      payload?: {
        updateReviewRecord?: (state: TypingState) => void
      }
    }
  | { type: TypingStateActionType.LOOP_CURRENT_WORD }
  | { type: TypingStateActionType.FINISH_CHAPTER }
  | { type: TypingStateActionType.SKIP_WORD }
  | { type: TypingStateActionType.SKIP_2_WORD_INDEX; newIndex: number }
  | { type: TypingStateActionType.REPEAT_CHAPTER; shouldShuffle: boolean }
  | { type: TypingStateActionType.NEXT_CHAPTER }
  | { type: TypingStateActionType.TOGGLE_TRANS_VISIBLE }
  | { type: TypingStateActionType.TICK_TIMER; addTime?: number }
  | { type: TypingStateActionType.ADD_WORD_RECORD_ID; payload: number }
  | { type: TypingStateActionType.SET_IS_SAVING_RECORD; payload: boolean }
  | { type: TypingStateActionType.SET_IS_LOOP_SINGLE_WORD; payload: boolean }
  | { type: TypingStateActionType.TOGGLE_IS_LOOP_SINGLE_WORD }
  | { type: TypingStateActionType.MARK_FAMILIAR_AND_SKIP }
  | { type: TypingStateActionType.REMOVE_WORD_BY_NAME; payload: string }
  | { type: TypingStateActionType.ADD_WORD_TO_CHAPTER; payload: WordWithIndex }
  | { type: TypingStateActionType.SET_IS_FINISHED; payload: boolean }

type Dispatch = (action: TypingStateAction) => void

export const typingReducer = (state: TypingState, action: TypingStateAction) => {
  switch (action.type) {
    case TypingStateActionType.SETUP_CHAPTER: {
      const newState = structuredClone(initialState)
      const words = action.payload.shouldShuffle ? shuffle(action.payload.words) : action.payload.words
      let initialIndex = action.payload.initialIndex ?? 0
      if (initialIndex >= words.length) {
        initialIndex = 0
      }
      newState.chapterData.index = initialIndex
      newState.chapterData.words = words
      newState.chapterData.userInputLogs = words.map((_, index) => ({ ...structuredClone(initialUserInputLog), index }))

      return newState
    }
    case TypingStateActionType.SET_IS_SKIP:
      state.isShowSkip = action.payload
      break
    case TypingStateActionType.SET_IS_TYPING:
      state.isTyping = action.payload
      break

    case TypingStateActionType.TOGGLE_IS_TYPING:
      state.isTyping = !state.isTyping
      break
    case TypingStateActionType.REPORT_CORRECT_WORD: {
      state.chapterData.correctCount += 1

      const wordLog = state.chapterData.userInputLogs[state.chapterData.index]
      wordLog.correctCount += 1
      break
    }
    case TypingStateActionType.REPORT_WRONG_WORD: {
      state.chapterData.wrongCount += 1

      const letterMistake = action.payload.letterMistake
      const wordLog = state.chapterData.userInputLogs[state.chapterData.index]
      wordLog.wrongCount += 1
      wordLog.LetterMistakes = mergeLetterMistake(wordLog.LetterMistakes, letterMistake)
      break
    }
    case TypingStateActionType.NEXT_WORD: {
      state.chapterData.index += 1
      state.chapterData.wordCount += 1
      state.isShowSkip = false

      if (action?.payload?.updateReviewRecord) {
        action.payload.updateReviewRecord(state)
      }
      break
    }
    case TypingStateActionType.LOOP_CURRENT_WORD:
      state.isShowSkip = false
      state.chapterData.wordCount += 1
      break
    case TypingStateActionType.FINISH_CHAPTER:
      state.chapterData.wordCount += 1
      state.isTyping = false
      state.isFinished = true
      state.isShowSkip = false
      break
    case TypingStateActionType.SKIP_WORD: {
      const newIndex = state.chapterData.index + 1
      if (newIndex >= state.chapterData.words.length) {
        state.isTyping = false
        state.isFinished = true
      } else {
        state.chapterData.index = newIndex
      }
      state.isShowSkip = false
      break
    }
    case TypingStateActionType.SKIP_2_WORD_INDEX: {
      const newIndex = action.newIndex
      if (newIndex >= state.chapterData.words.length) {
        state.isTyping = false
        state.isFinished = true
      }
      state.chapterData.index = newIndex
      break
    }
    case TypingStateActionType.REPEAT_CHAPTER: {
      const newState = structuredClone(initialState)
      newState.chapterData.userInputLogs = state.chapterData.words.map((_, index) => ({ ...structuredClone(initialUserInputLog), index }))
      newState.isTyping = true
      newState.chapterData.words = action.shouldShuffle ? shuffle(state.chapterData.words) : state.chapterData.words
      newState.isTransVisible = state.isTransVisible
      return newState
    }
    case TypingStateActionType.NEXT_CHAPTER: {
      const newState = structuredClone(initialState)
      newState.chapterData.userInputLogs = state.chapterData.words.map((_, index) => ({ ...structuredClone(initialUserInputLog), index }))
      newState.isTyping = true
      newState.isTransVisible = state.isTransVisible
      return newState
    }
    case TypingStateActionType.TOGGLE_TRANS_VISIBLE:
      state.isTransVisible = !state.isTransVisible
      break
    case TypingStateActionType.TICK_TIMER: {
      const increment = action.addTime === undefined ? 1 : action.addTime
      const newTime = state.timerData.time + increment
      const inputSum =
        state.chapterData.correctCount + state.chapterData.wrongCount === 0
          ? 1
          : state.chapterData.correctCount + state.chapterData.wrongCount

      state.timerData.time = newTime
      state.timerData.accuracy = Math.round((state.chapterData.correctCount / inputSum) * 100)
      state.timerData.wpm = Math.round((state.chapterData.wordCount / newTime) * 60)
      break
    }
    case TypingStateActionType.ADD_WORD_RECORD_ID: {
      state.chapterData.wordRecordIds.push(action.payload)
      break
    }
    case TypingStateActionType.SET_IS_SAVING_RECORD: {
      state.isSavingRecord = action.payload
      break
    }
    case TypingStateActionType.SET_IS_LOOP_SINGLE_WORD: {
      state.isLoopSingleWord = action.payload
      break
    }
    case TypingStateActionType.TOGGLE_IS_LOOP_SINGLE_WORD: {
      state.isLoopSingleWord = !state.isLoopSingleWord
      break
    }
    case TypingStateActionType.MARK_FAMILIAR_AND_SKIP: {
      const currentIndex = state.chapterData.index
      if (currentIndex < 0 || currentIndex >= state.chapterData.words.length) {
        break
      }

      state.chapterData.words.splice(currentIndex, 1)
      state.chapterData.userInputLogs.splice(currentIndex, 1)
      state.chapterData.userInputLogs.forEach((log, index) => {
        log.index = index
      })
      state.chapterData.words.forEach((word, index) => {
        word.index = index
      })
      state.isShowSkip = false

      if (state.chapterData.words.length === 0) {
        // 本章练习词已清空（例如全部标为熟词），直接进入过关
        state.isTyping = false
        state.isFinished = true
      } else if (currentIndex >= state.chapterData.words.length) {
        state.chapterData.index = state.chapterData.words.length - 1
        state.isTyping = false
        state.isFinished = true
      } else {
        state.chapterData.index = currentIndex
      }
      break
    }
    case TypingStateActionType.REMOVE_WORD_BY_NAME: {
      const wordName = action.payload
      const removeIndex = state.chapterData.words.findIndex((word) => word.name === wordName)
      if (removeIndex < 0) {
        break
      }

      const currentIndex = state.chapterData.index
      state.chapterData.words.splice(removeIndex, 1)
      state.chapterData.userInputLogs.splice(removeIndex, 1)
      state.chapterData.userInputLogs.forEach((log, index) => {
        log.index = index
      })
      state.chapterData.words.forEach((word, index) => {
        word.index = index
      })

      if (state.chapterData.words.length === 0) {
        state.chapterData.index = 0
        state.isTyping = false
        state.isFinished = true
        break
      }

      if (removeIndex < currentIndex) {
        state.chapterData.index = currentIndex - 1
      } else if (removeIndex === currentIndex) {
        if (currentIndex >= state.chapterData.words.length) {
          state.chapterData.index = state.chapterData.words.length - 1
          state.isTyping = false
          state.isFinished = true
        } else {
          state.chapterData.index = currentIndex
        }
      }
      break
    }
    case TypingStateActionType.ADD_WORD_TO_CHAPTER: {
      const word = action.payload
      if (state.chapterData.words.some((item) => item.name === word.name)) {
        break
      }
      const nextIndex = state.chapterData.words.length
      state.chapterData.words.push({ ...word, index: nextIndex })
      state.chapterData.userInputLogs.push({ ...structuredClone(initialUserInputLog), index: nextIndex })
      if (state.isFinished) {
        state.isFinished = false
      }
      break
    }
    case TypingStateActionType.SET_IS_FINISHED: {
      state.isFinished = action.payload
      if (action.payload) {
        state.isTyping = false
        state.isShowSkip = false
      }
      break
    }
    default: {
      return state
    }
  }
}

export const TypingContext = createContext<{ state: TypingState; dispatch: Dispatch } | null>(null)
