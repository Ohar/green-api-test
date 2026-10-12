import type { AvatarProps } from './index'
import { getInitials } from './helpers/getInitials'
import styles from './Avatar.module.css'

export function Avatar({ label, large = false }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${large ? styles.large : ''}`}
      aria-hidden="true"
    >
      {getInitials(label)}
    </span>
  )
}
