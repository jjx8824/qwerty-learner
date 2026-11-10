import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import IconBookmark from '~icons/tabler/bookmark'

const FamiliarBookButton = () => {
  const navigate = useNavigate()

  const toFamiliarBook = useCallback(() => {
    navigate('/familiar-book')
  }, [navigate])

  return (
    <button
      type="button"
      onClick={toFamiliarBook}
      className={`flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white`}
      title="查看熟词本"
    >
      <IconBookmark className="icon" />
    </button>
  )
}

export default FamiliarBookButton
