import { MessengerChat } from '../components/MessengerChat'
import { ENABLED_MESSENGERS } from '../config/enabled'

export function App() {
  return (
    <main className={ENABLED_MESSENGERS.length > 1
      ? 'messengers messengers--both' : 'messengers'}>
      {ENABLED_MESSENGERS.map((messenger) => (
        <section
          className="messenger"
          aria-label={messenger.label}
          key={messenger.id}
        >
          <MessengerChat
            messenger={messenger}
            showLabel={ENABLED_MESSENGERS.length > 1}
          />
        </section>
      ))}
    </main>
  )
}
