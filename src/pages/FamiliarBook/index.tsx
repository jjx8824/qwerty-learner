import FamiliarRow from './FamiliarRow'
import Pagination, { ITEM_PER_PAGE } from '@/pages/ErrorBook/Pagination'
import { getAllFamiliarWords, removeFamiliarWord } from '@/utils/db/familiar-words'
import type { IFamiliarWord } from '@/utils/db/record'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconX from '~icons/tabler/x'

export function FamiliarBook() {
  const [records, setRecords] = useState<IFamiliarWord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [reload, setReload] = useState(false)
  const navigate = useNavigate()
  const totalPages = useMemo(() => Math.max(1, Math.ceil(records.length / ITEM_PER_PAGE)), [records.length])

  const onBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const setPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return
      setCurrentPage(page)
    },
    [totalPages],
  )

  const renderRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEM_PER_PAGE
    const end = start + ITEM_PER_PAGE
    return records.slice(start, end)
  }, [currentPage, records])

  useEffect(() => {
    getAllFamiliarWords()
      .then((list) => {
        setRecords(list)
        setCurrentPage((page) => {
          const pages = Math.max(1, Math.ceil(list.length / ITEM_PER_PAGE))
          return page > pages ? pages : page
        })
      })
      .catch((error) => {
        console.error('加载熟词本失败:', error)
        setRecords([])
      })
  }, [reload])

  const handleDelete = async (word: string, dict: string) => {
    await removeFamiliarWord(dict, word)
    setReload((prev) => !prev)
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center pb-4 ease-in">
      <div className="mr-8 mt-4 flex w-auto items-center justify-center self-end">
        <h1 className="font-lighter mr-4 w-auto self-end text-gray-500 opacity-70">Tip: 点击删除图标可取消熟词标记</h1>
        <IconX className="h-7 w-7 cursor-pointer text-gray-400" onClick={onBack} />
      </div>

      <div className="flex w-full flex-1 select-text items-start justify-center overflow-hidden">
        <div className="flex h-full w-5/6 flex-col pt-10">
          <div className="flex w-full justify-between rounded-lg bg-white px-6 py-5 text-lg text-black shadow-lg dark:bg-gray-800 dark:text-white">
            <span className="basis-2/12">单词</span>
            <span className="basis-7/12">释义</span>
            <span className="basis-2/12">词典</span>
            <span className="basis-1/12">操作</span>
          </div>
          <ScrollArea.Root className="flex-1 overflow-y-auto pt-5">
            <ScrollArea.Viewport className="h-full">
              <div className="flex flex-col gap-3">
                {renderRecords.length === 0 ? (
                  <div className="rounded-lg bg-white px-6 py-10 text-center text-gray-400 shadow-md dark:bg-gray-800">
                    暂无熟词，练习时按 Ctrl + M 可将当前词标为熟词
                  </div>
                ) : (
                  renderRecords.map((record) => (
                    <FamiliarRow
                      key={`${record.dict}-${record.word}-${record.id ?? record.createTime}`}
                      record={record}
                      onDelete={() => handleDelete(record.word, record.dict)}
                    />
                  ))
                )}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent" orientation="vertical"></ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
      </div>
      <Pagination className="pt-3" page={currentPage} setPage={setPage} totalPages={totalPages} />
    </div>
  )
}
