import { DecorativeImage } from './DecorativeImage'
import logo from '../assets/logo.png'
import visibilityIcon from '../assets/icone-visibilidade.svg'
import securityIcon from '../assets/icone-seguranca.svg'
import decisionsIcon from '../assets/icone-decisoes.svg'

// Painel esquerdo das telas de autenticação. Conteúdo do Figma (frame "Login" 41:3).
const benefits = [
  {
    icon: visibilityIcon,
    title: 'Visibilidade Total',
    text: 'Acompanhe tudo em tempo real, em um só lugar.',
  },
  {
    icon: securityIcon,
    title: 'Mais Segurança',
    // O Figma traz "Idenfique" (erro de digitação); corrigido aqui.
    text: 'Identifique e previna problemas antes que impactem seu negócio.',
  },
  {
    icon: decisionsIcon,
    title: 'Decisões baseadas em dados',
    text: 'Transforme logs em insights estratégicos.',
  },
]

export function BrandPanel() {
  return (
    <section className="lh-marca" aria-label="LhamaLog">
      <div className="lh-marca-topo">
        <DecorativeImage src={logo} className="lh-marca-logo" />
        <span className="lh-marca-nome">LhamaLog</span>
      </div>

      <div className="lh-marca-corpo">
        <h2 className="lh-marca-titulo">
          Logs que impulsionam <span className="lh-marca-destaque">decisões.</span>
        </h2>

        <ul className="lh-beneficios">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="lh-beneficio">
              <span className="lh-beneficio-icone">
                <DecorativeImage src={benefit.icon} />
              </span>
              <span>
                <strong className="lh-beneficio-titulo">{benefit.title}</strong>
                <span className="lh-beneficio-texto">{benefit.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="lh-marca-rodape">Observabilidade hoje. Resultados amanhã.</p>
    </section>
  )
}
