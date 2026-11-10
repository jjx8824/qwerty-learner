import Tooltip from '@/components/Tooltip'
import { isReviewModeAtom, skipFamiliarWordsAtom } from '@/store'
import { useAtom, useAtomValue } from 'jotai'
import IconBookmark from '~icons/tabler/bookmark'
import IconBookmarkOff from '~icons/tabler/bookmark-off'

export default function SkipFamiliarSwitcher() {
  const [skipFamiliarWords, setSkipFamiliarWords] = useAtom(skipFamiliarWordsAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)

  if (isReviewMode) {
    return null
  }

  return (
    <Tooltip className="h-7 w-7" content={skipFamiliarWords ? '关闭跳过熟词' : '开启跳过熟词'}>
      <button
        className={`p-[2px] ${skipFamiliarWords ? 'text-indigo-500' : 'text-gray-500'} text-lg focus:outline-none`}
        type="button"
        onClick={(e) => {
          setSkipFamiliarWords((old) => !old)
          e.currentTarget.blur()
        }}
        aria-label={skipFamiliarWords ? '关闭跳过熟词' : '开启跳过熟词'}
      >
        {skipFamiliarWords ? <IconBookmark /> : <IconBookmarkOff />}
      </button>
    </Tooltip>
  )
}
