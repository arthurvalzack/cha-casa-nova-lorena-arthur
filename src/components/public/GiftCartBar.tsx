interface Props { count: number; onOpen: () => void }
export default function GiftCartBar({ count, onOpen }: Props) {
  if (!count) return null
  return <div className="gift-cart-bar"><span>{count} presente{count === 1 ? '' : 's'} selecionado{count === 1 ? '' : 's'}</span><button onClick={onOpen}>Ver seleção</button></div>
}
