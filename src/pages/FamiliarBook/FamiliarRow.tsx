import { LoadingWordUI } from '../ErrorBook/LoadingWordUI'
import useGetWord from '../ErrorBook/hooks/useGetWord'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { idDictionaryMap } from '@/resources/dictionary'
import type { IFamiliarWord } from '@/utils/db/record'
import type { FC } from 'react'
import DeleteIcon from '~icons/weui/delete-filled'

type FamiliarRowProps = {
  record: IFamiliarWord
  onDelete: () => void
}

const FamiliarRow: FC<FamiliarRowProps> = ({ record, onDelete }) => {
  const dictInfo = idDictionaryMap[record.dict]
  const { word, isLoading, hasError } = useGetWord(record.word, dictInfo)

  return (
    <li className="opacity-85 flex w-full items-center justify-between rounded-lg bg-white px-6 py-3 text-black shadow-md dark:bg-gray-800 dark:text-white">
      <span className="basis-2/12 break-normal">{record.word}</span>
      <span className="basis-7/12 break-normal">
        {word ? word.trans.join('；') : <LoadingWordUI isLoading={isLoading} hasError={hasError} />}
      </span>
      <span className="basis-2/12 break-normal">{dictInfo?.name ?? record.dict}</span>
      <span
        className="basis-1/12 break-normal"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="cursor-pointer focus:outline-none" aria-label={`取消熟词 ${record.word}`}>
                <DeleteIcon />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>取消熟词</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    </li>
  )
}

export default FamiliarRow
