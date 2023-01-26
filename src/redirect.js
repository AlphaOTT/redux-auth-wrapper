import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Redirect = ({ redirectParams, loader }) => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(redirectParams)
  }, [])

  if (loader) {
    return loader
  }

  return null
}

export default Redirect
