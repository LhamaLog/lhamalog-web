type DecorativeImageProps = {
  src: string
  className?: string
}

// Imagem decorativa que some sozinha se o arquivo não carregar.
export function DecorativeImage({ src, className }: DecorativeImageProps) {
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={(event) => {
        event.currentTarget.style.display = 'none'
      }}
    />
  )
}
