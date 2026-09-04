import { randomUUID } from 'node:crypto'
import type { Blocos } from '../src/lib/content/blocos'

const id = () => randomUUID()

type Def = {
  slug: string
  titulo: string
  descricao?: string
  pai?: string
  ordem?: number
  noMenu?: boolean
  fixa?: boolean
  blocos: Blocos
}

/** cabeçalho padrão das páginas internas */
function cab(migalha: string, titulo: string, texto?: string, fundo: 'amarelo' | 'escuro' = 'amarelo'): Blocos[number] {
  return {
    id: id(),
    tipo: 'cabecalho',
    migalha,
    titulo,
    texto,
    fundo,
    decor: { tipo: 'raio', forma: 'raio', cor: fundo === 'amarelo' ? 'offwhite' : 'amarelo', lado: 'direita', tamanho: 'medio', sangra: false, opacidade: 1 },
  }
}

/** faixa de conteúdo simples: título + texto num quadrante */
function faixaTexto(fundo: 'offwhite' | 'amarelo' | 'escuro', titulo: string, texto: string): Blocos[number] {
  return {
    id: id(),
    tipo: 'faixa',
    fundo,
    layout: '1',
    alinhamento: 'start',
    espacamento: 'normal',
    decor: null,
    quadrantes: [[
      { tipo: 'titulo', texto: titulo, tamanho: 'g' },
      { tipo: 'paragrafo', texto },
    ]],
  }
}

function faixaLinhas(
  titulo: string,
  itens: { rotulo: string; titulo: string; texto?: string }[],
  comFoto = true
): Blocos[number] {
  return {
    id: id(),
    tipo: 'faixa',
    fundo: 'offwhite',
    acento: 'azul',
    layout: '1',
    alinhamento: 'start',
    espacamento: 'normal',
    decor: null,
    quadrantes: [[
      { tipo: 'titulo', texto: titulo, tamanho: 'm' },
      { tipo: 'linhas', itens: itens.map((i) => ({ ...i, foto: { midiaId: null, legenda: 'foto' } })), comFoto, tamanhoRotulo: 'p' },
    ]],
  }
}

function faixaCards(
  titulo: string,
  itens: { titulo: string; texto: string; tag?: string; corTag?: 'amarelo' | 'azul' | 'laranja' }[]
): Blocos[number] {
  return {
    id: id(),
    tipo: 'faixa',
    fundo: 'offwhite',
    layout: '1',
    alinhamento: 'start',
    espacamento: 'normal',
    decor: null,
    quadrantes: [[
      { tipo: 'titulo', texto: titulo, tamanho: 'm' },
      { tipo: 'cards', colunas: 3, itens: itens.map((i) => ({ ...i, foto: { midiaId: null, legenda: 'foto' } })) },
    ]],
  }
}

export const PAGINAS: Def[] = [
  {
    slug: '/',
    titulo: 'Início',
    descricao: 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
    ordem: 0,
    fixa: true,
    blocos: [
      {
        id: id(),
        tipo: 'hero',
        chapeu: 'Programa de Educação Tutorial · Engenharia Elétrica · UFSC',
        titulo: 'Ensino, pesquisa e extensão feitos por estudantes',
        texto: 'Projetos, cursos, seminários e visitas técnicas conduzidos pelos próprios petianos, no Centro Tecnológico da UFSC.',
        botoes: [
          { texto: 'Conheça o PET', href: '/sobre', variante: 'solido' },
          { texto: 'Nossos projetos', href: '/pesquisa', variante: 'contorno' },
        ],
        fotos: [
          { midiaId: null, legenda: 'foto principal do grupo' },
          { midiaId: null, legenda: 'foto secundária' },
          { midiaId: null, legenda: 'foto secundária' },
        ],
      },
      {
        id: id(),
        tipo: 'faixa',
        fundo: 'offwhite',
        layout: '1',
        alinhamento: 'start',
        espacamento: 'normal',
        decor: null,
        quadrantes: [[
          { tipo: 'titulo', texto: 'Os pilares', tamanho: 'm' },
          {
            tipo: 'cards',
            colunas: 3,
            itens: [
              { titulo: 'Pesquisa', texto: 'Projetos internos, projetos externos em laboratórios e empresas, e estágios de férias.', href: '/pesquisa', corTag: 'amarelo' },
              { titulo: 'Ensino', texto: 'Cursos com certificado da UFSC, seminários semanais e a série Conheça seu Professor.', href: '/ensino', corTag: 'azul' },
              { titulo: 'Extensão', texto: 'VMC, SAEEL, Tech Week e Conheça o Laboratório.', href: '/extensao', corTag: 'laranja' },
            ],
          },
        ]],
      },
      {
        id: id(),
        tipo: 'faixa',
        fundo: 'escuro',
        acento: 'amarelo',
        layout: '2-60/40',
        alinhamento: 'center',
        espacamento: 'normal',
        decor: { tipo: 'raio', forma: 'raio', cor: 'amarelo', lado: 'direita', tamanho: 'gigante', sangra: false, opacidade: 0.9 },
        quadrantes: [
          [
            { tipo: 'chip', texto: 'Destaque', cor: 'amarelo', estilo: 'solido', inclinado: false },
            { tipo: 'titulo', texto: 'VMC — Volta ao Mundo do Conhecimento', tamanho: 'g' },
            { tipo: 'paragrafo', texto: 'Visitas técnicas em empresas nacionais e internacionais, organizadas pelos membros do PET EEL.' },
            { tipo: 'botoes', itens: [{ texto: 'Veja mais', href: '/vmc', variante: 'solido' }] },
          ],
          [],
        ],
      },
      {
        id: id(),
        tipo: 'faixa',
        fundo: 'offwhite',
        layout: '1',
        alinhamento: 'start',
        espacamento: 'normal',
        decor: null,
        quadrantes: [[
          { tipo: 'titulo', texto: 'O PET em imagens', tamanho: 'm' },
          {
            tipo: 'galeria',
            colunas: 4,
            proporcao: '1/1',
            destaque: true,
            itens: [
              { midiaId: null, legenda: 'Seminário semanal' },
              { midiaId: null, legenda: 'VMC — visita técnica' },
              { midiaId: null, legenda: 'Aulão de C' },
              { midiaId: null, legenda: 'Laboratório do CTC' },
              { midiaId: null, legenda: 'Tech Week' },
            ],
          },
        ]],
      },
      {
        id: id(),
        tipo: 'faixa',
        fundo: 'escuro',
        acento: 'laranja',
        layout: '2',
        alinhamento: 'start',
        espacamento: 'normal',
        decor: { tipo: 'raio', forma: 'raio', cor: 'laranja', lado: 'esquerda', tamanho: 'gigante', sangra: true, opacidade: 0.85 },
        quadrantes: [
          [
            { tipo: 'chip', texto: 'Programa', cor: 'laranja', estilo: 'contorno', inclinado: false },
            { tipo: 'titulo', texto: 'Connect', tamanho: 'g' },
            { tipo: 'paragrafo', texto: 'Iniciativas do PET EEL que conectam o grupo ao CTC e à graduação, com soluções e capacitação.' },
            { tipo: 'botoes', itens: [
              { texto: 'Connect Build', href: '/connect/build', variante: 'solido' },
              { texto: 'Connect Week', href: '/connect/week', variante: 'contorno' },
            ] },
          ],
          [{ tipo: 'lista', itens: [
            { titulo: 'Connect Build', texto: 'Programa de soluções voltadas para o CTC e para a graduação.' },
            { titulo: 'Connect Week', texto: 'Evento de capacitação com workshops ministrados por membros do PET.' },
          ] }],
        ],
      },
      {
        id: id(),
        tipo: 'faixa',
        fundo: 'amarelo',
        acento: 'escuro',
        layout: '2-60/40',
        alinhamento: 'center',
        espacamento: 'normal',
        decor: { tipo: 'raio', forma: 'raio', cor: 'offwhite', lado: 'direita', tamanho: 'medio', sangra: false, opacidade: 1 },
        quadrantes: [
          [
            { tipo: 'chip', texto: 'Processo seletivo', estilo: 'contorno', inclinado: false },
            { tipo: 'titulo', texto: 'Quer entrar no PET EEL?', tamanho: 'g' },
            { tipo: 'paragrafo', texto: 'As vagas são abertas periodicamente para estudantes de Engenharia Elétrica e Eletrônica da UFSC.' },
          ],
          [{ tipo: 'botoes', itens: [{ texto: 'Ver etapas', href: '/processo-seletivo', variante: 'solido' }] }],
        ],
      },
    ],
  },

  // ── Quem somos ──
  {
    slug: '/sobre', titulo: 'Quem somos', ordem: 1,
    blocos: [
      cab('Quem somos', 'Quem somos', 'Petianos de todas as fases da graduação, um tutor docente e uma estrutura interna dividida por áreas de trabalho.'),
      faixaTexto('offwhite', 'O programa', 'O PET é um programa do MEC que reúne graduandos sob orientação de um tutor, com atuação em ensino, pesquisa e extensão de forma indissociável.'),
    ],
  },
  {
    slug: '/estrutura-interna', titulo: 'Estrutura interna', pai: '/sobre', ordem: 0,
    blocos: [
      cab('Quem somos / Estrutura interna', 'Estrutura interna', 'Como o grupo se organiza por coordenações e projetos.'),
      faixaLinhas('Coordenações', [
        { rotulo: 'Pesquisa', titulo: 'Coordenação de Pesquisa', texto: 'Acompanha projetos internos, externos e estágios de férias.' },
        { rotulo: 'Ensino', titulo: 'Coordenação de Ensino', texto: 'Organiza cursos, seminários e a série Conheça seu Professor.' },
        { rotulo: 'Extensão', titulo: 'Coordenação de Extensão', texto: 'Cuida da VMC, SAEEL e Tech Week.' },
      ], false),
    ],
  },
  {
    slug: '/membros', titulo: 'Nossa equipe', pai: '/sobre', ordem: 1,
    blocos: [
      cab('Quem somos / Nossa equipe', 'Nossa equipe', 'Petianos de todas as fases da graduação, organizados por área de atuação.', 'escuro'),
      { id: id(), tipo: 'equipe', mostrarTutor: true, limite: null },
    ],
  },
  {
    slug: '/processo-seletivo', titulo: 'Processo seletivo', pai: '/sobre', ordem: 2,
    blocos: [
      cab('Quem somos / Processo seletivo', 'Processo seletivo', 'Vagas abertas periodicamente para estudantes de Engenharia Elétrica e Eletrônica da UFSC.'),
      faixaLinhas('Etapas', [
        { rotulo: 'Etapa 1', titulo: 'Inscrição', texto: 'Formulário divulgado aqui e no Instagram do grupo.' },
        { rotulo: 'Etapa 2', titulo: 'Dinâmica em grupo', texto: 'Atividade presencial no CTC.' },
        { rotulo: 'Etapa 3', titulo: 'Entrevista', texto: 'Conversa com petianos e com o tutor.' },
      ], false),
    ],
  },
  {
    slug: '/ex-petianos', titulo: 'Ex-PETianos', pai: '/sobre', ordem: 3,
    blocos: [
      cab('Quem somos / Ex-PETianos', 'Ex-PETianos', 'Quem passou pelo grupo e onde está hoje.'),
      faixaLinhas('Egressos', [
        { rotulo: '2024', titulo: 'Egressos 2024', texto: 'Nomes, ano de formatura e destino.' },
        { rotulo: '2023', titulo: 'Egressos 2023', texto: 'Nomes, ano de formatura e destino.' },
        { rotulo: '2022', titulo: 'Egressos 2022', texto: 'Nomes, ano de formatura e destino.' },
      ], false),
    ],
  },

  // ── Pesquisa ──
  {
    slug: '/pesquisa', titulo: 'Pesquisa', ordem: 2,
    blocos: [
      cab('Pesquisa', 'Pesquisa', 'Projetos internos, projetos externos em laboratórios e empresas, e estágios de férias.'),
      faixaCards('Frentes', [
        { titulo: 'Projetos internos', texto: 'Projetos autônomos conduzidos dentro do grupo.', tag: 'Interno' },
        { titulo: 'Projetos externos', texto: 'Pesquisa em laboratórios da UFSC e empresas parceiras.', tag: 'Externo', corTag: 'azul' },
        { titulo: 'Estágios de férias', texto: 'Experiências curtas em empresas durante o recesso.', tag: 'Férias', corTag: 'laranja' },
      ]),
    ],
  },
  {
    slug: '/projetos-internos', titulo: 'Projetos internos', pai: '/pesquisa', ordem: 0,
    blocos: [
      cab('Pesquisa / Projetos internos', 'Projetos internos', 'Projetos autônomos conduzidos dentro do grupo, com recursos providos pelo PET.'),
      faixaCards('Projetos', [
        { titulo: 'Retro Pong', texto: 'Pong em Arduino Uno com matriz de LEDs e joysticks. Dois modos: individual e em dupla.', tag: 'Concluído' },
        { titulo: 'Projeto em andamento', texto: 'Proposta, desenvolvimento e resultados de um projeto interno atual.', tag: 'Em curso', corTag: 'azul' },
        { titulo: 'Projeto em andamento', texto: 'Cada projeto ganha página própria com fotos, autores e etapas.', tag: 'Em curso', corTag: 'azul' },
      ]),
    ],
  },
  {
    slug: '/projetos-externos', titulo: 'Projetos externos', pai: '/pesquisa', ordem: 1,
    blocos: [
      cab('Pesquisa / Projetos externos', 'Projetos externos', 'Petianos vinculados a laboratórios do CTC, empresas parceiras e equipes de competição.'),
      faixaLinhas('Frentes', [
        { rotulo: 'Laboratório', titulo: 'Pesquisa em laboratório da UFSC', texto: 'Petiano vinculado a um laboratório do CTC, com orientação de professor.' },
        { rotulo: 'Empresa', titulo: 'Pesquisa em empresa parceira', texto: 'Trabalho desenvolvido dentro de empresa, com acompanhamento do grupo.' },
        { rotulo: 'Competição', titulo: 'Equipe de competição da UFSC', texto: 'Participação em equipes como projeto de extensão da universidade.' },
      ]),
    ],
  },
  {
    slug: '/estagio-de-ferias', titulo: 'Estágios de férias', pai: '/pesquisa', ordem: 2,
    blocos: [
      cab('Pesquisa / Estágios de férias', 'Estágios de férias', 'Experiências curtas em empresas durante o recesso acadêmico.'),
      faixaTexto('offwhite', 'Como funciona', 'O grupo divulga oportunidades e acompanha os petianos durante o período de estágio.'),
    ],
  },

  // ── Ensino ──
  {
    slug: '/ensino', titulo: 'Ensino', ordem: 3,
    blocos: [
      cab('Ensino', 'Ensino', 'Cursos com certificado da UFSC, seminários semanais e a série Conheça seu Professor.'),
      faixaCards('Frentes', [
        { titulo: 'Cursos', texto: 'Aulões e cursos abertos à comunidade do CTC.', tag: 'Curso' },
        { titulo: 'Seminários', texto: 'Encontros semanais às sextas, 12h10.', tag: 'Semanal', corTag: 'azul' },
        { titulo: 'Conheça seu Professor', texto: 'Entrevistas em vídeo com docentes do CTC.', tag: 'Vídeo', corTag: 'laranja' },
      ]),
    ],
  },
  {
    slug: '/cursos', titulo: 'Cursos', pai: '/ensino', ordem: 0,
    blocos: [
      cab('Ensino / Cursos', 'Cursos', 'Aulões e cursos abertos à comunidade do CTC, com certificado validado pela UFSC.'),
      faixaLinhas('Agenda', [
        { rotulo: 'Mar · 18-19', titulo: 'Aulões de C', texto: 'Dois encontros de introdução à linguagem C. Certificado pela UFSC.' },
        { rotulo: 'A definir', titulo: 'Curso de eletrônica básica', texto: 'Ministrante, carga horária, local e link de inscrição.' },
        { rotulo: 'A definir', titulo: 'Curso externo convidado', texto: 'Cursos com ministrantes externos trazidos pelo grupo.' },
      ]),
    ],
  },
  {
    slug: '/seminarios', titulo: 'Seminários', pai: '/ensino', ordem: 1,
    blocos: [
      cab('Ensino / Seminários', 'Seminários', 'Toda sexta, 12h10, no CTC. Sala divulgada nos stories.'),
      faixaLinhas('Próximos', [
        { rotulo: 'Sex · 12h10', titulo: 'Domando o indomável', texto: 'Seminário apresentado por um membro do grupo.' },
        { rotulo: 'Sex · 12h10', titulo: 'A história da exploração espacial', texto: 'Tema livre escolhido pelo ministrante.' },
        { rotulo: 'Sex · 12h10', titulo: 'Próximo seminário', texto: 'A agenda das próximas semanas entra aqui.' },
      ], false),
    ],
  },
  {
    slug: '/conheca-seu-professor', titulo: 'Conheça seu Professor', pai: '/ensino', ordem: 2,
    blocos: [
      cab('Ensino / Conheça seu Professor', 'Conheça seu Professor', 'Entrevistas em vídeo com docentes do Centro Tecnológico.'),
      faixaCards('Entrevistas', [
        { titulo: 'Entrevista 01', texto: 'Trajetória, linha de pesquisa e conselhos para a graduação.', tag: 'Vídeo' },
        { titulo: 'Entrevista 02', texto: 'Espaço para nova entrevista: foto, nome e link do vídeo.', tag: 'Vídeo' },
        { titulo: 'Entrevista 03', texto: 'Espaço para nova entrevista.', tag: 'Vídeo' },
      ]),
    ],
  },

  // ── Extensão ──
  {
    slug: '/extensao', titulo: 'Extensão', ordem: 4,
    blocos: [
      cab('Extensão', 'Extensão', 'VMC, SAEEL, Tech Week e Conheça o Laboratório.'),
      faixaCards('Projetos', [
        { titulo: 'VMC', texto: 'Visitas técnicas em empresas nacionais e internacionais.', tag: 'Visitas' },
        { titulo: 'Tech Week', texto: 'Semana de oficinas e palestras técnicas.', tag: 'Evento', corTag: 'laranja' },
      ]),
    ],
  },
  {
    slug: '/vmc', titulo: 'VMC', pai: '/extensao', ordem: 0,
    blocos: [
      cab('Extensão / VMC', 'Volta ao Mundo do Conhecimento', 'Visitas técnicas em empresas nacionais e internacionais, organizadas pelos membros do PET EEL.'),
      faixaCards('Edições', [
        { titulo: 'VMC XVI', texto: 'CREA-SC', tag: 'Edição' },
        { titulo: 'VMC XV', texto: 'Edição anterior', tag: 'Edição' },
        { titulo: 'VMC XIV', texto: 'Edição anterior', tag: 'Edição' },
      ]),
    ],
  },
  {
    slug: '/vmc/edicao', titulo: 'VMC — página de edição', pai: '/extensao', ordem: 1, noMenu: false,
    blocos: [
      cab('Extensão / VMC', 'VMC XVI', 'Registro de uma edição: roteiro, empresas visitadas e fotos.'),
      faixaTexto('offwhite', 'Sobre a edição', 'Roteiro, empresas visitadas e participantes desta edição da VMC.'),
    ],
  },
  {
    slug: '/conheca-o-lab', titulo: 'Conheça o Laboratório', pai: '/extensao', ordem: 3,
    blocos: [
      cab('Extensão / Conheça o Laboratório', 'Conheça o Laboratório', 'Visitas guiadas aos laboratórios do CTC, com os professores responsáveis.'),
      faixaCards('Episódios', [
        { titulo: 'Laboratório 01', texto: 'Visita guiada com o professor responsável.', tag: 'Vídeo', corTag: 'laranja' },
        { titulo: 'Laboratório 02', texto: 'Espaço para novo episódio da série.', tag: 'Vídeo', corTag: 'laranja' },
        { titulo: 'Laboratório 03', texto: 'Espaço para novo episódio da série.', tag: 'Vídeo', corTag: 'laranja' },
      ]),
    ],
  },
  {
    slug: '/saeel', titulo: 'SAEEL', pai: '/extensao', ordem: 4,
    blocos: [
      cab('Extensão / SAEEL', 'SAEEL', 'Semana Acadêmica de Engenharia Elétrica e Eletrônica.'),
      faixaTexto('offwhite', 'Sobre', 'Evento anual com palestras, minicursos e mesas-redondas organizado com o apoio do PET.'),
    ],
  },
  {
    slug: '/tech-week', titulo: 'Tech Week', pai: '/extensao', ordem: 5,
    blocos: [
      cab('Extensão / Tech Week', 'Tech Week', 'Semana de oficinas e palestras técnicas abertas ao CTC.'),
      faixaLinhas('Programação', [
        { rotulo: 'Dia 1', titulo: 'Oficina de abertura', texto: 'Programação a confirmar com o grupo.' },
        { rotulo: 'Dia 2', titulo: 'Palestra técnica', texto: 'Programação a confirmar com o grupo.' },
        { rotulo: 'Dia 3', titulo: 'Encerramento', texto: 'Programação a confirmar com o grupo.' },
      ]),
    ],
  },

  // ── Connect ──
  {
    slug: '/connect', titulo: 'Connect', ordem: 5,
    blocos: [
      cab('Connect', 'Connect', 'Iniciativas do PET EEL que conectam o grupo ao CTC e à graduação, com soluções e capacitação.', 'escuro'),
      {
        id: id(), tipo: 'faixa', fundo: 'escuro', acento: 'laranja', layout: '2',
        alinhamento: 'start', espacamento: 'normal',
        decor: { tipo: 'raio', forma: 'raio', cor: 'laranja', lado: 'esquerda', tamanho: 'gigante', sangra: true, opacidade: 0.85 },
        quadrantes: [
          [
            { tipo: 'titulo', texto: 'Duas frentes', tamanho: 'g' },
            { tipo: 'paragrafo', texto: 'O Connect reúne as iniciativas do PET EEL voltadas a soluções e capacitação.' },
            { tipo: 'botoes', itens: [
              { texto: 'Connect Build', href: '/connect/build', variante: 'solido' },
              { texto: 'Connect Week', href: '/connect/week', variante: 'contorno' },
            ] },
          ],
          [{ tipo: 'lista', itens: [
            { titulo: 'Connect Build', texto: 'Programa de soluções voltadas para o CTC e para a graduação.' },
            { titulo: 'Connect Week', texto: 'Evento de capacitação com workshops ministrados por membros do PET.' },
          ] }],
        ],
      },
    ],
  },
  {
    slug: '/connect/build', titulo: 'Connect Build', pai: '/connect', ordem: 0,
    blocos: [
      cab('Connect / Connect Build', 'Connect Build', 'Programa de soluções voltadas para o CTC e para a graduação.', 'escuro'),
      faixaTexto('offwhite', 'Sobre o programa', 'O Connect Build reúne petianos no desenvolvimento de soluções para demandas reais do Centro Tecnológico e da graduação em Engenharia Elétrica.'),
    ],
  },
  {
    slug: '/connect/week', titulo: 'Connect Week', pai: '/connect', ordem: 1,
    blocos: [
      cab('Connect / Connect Week', 'Connect Week', 'Evento de capacitação com workshops ministrados por membros do PET.', 'escuro'),
      faixaLinhas('Programação', [
        { rotulo: 'Dia 1', titulo: 'Workshop de abertura', texto: 'Programação a confirmar com o grupo.' },
        { rotulo: 'Dia 2', titulo: 'Workshop técnico', texto: 'Ministrado por um membro do PET EEL.' },
        { rotulo: 'Dia 3', titulo: 'Encerramento', texto: 'Programação a confirmar com o grupo.' },
      ], false),
    ],
  },

  // ── Mapa ──
  {
    slug: '/mapa', titulo: 'Mapa do site', ordem: 9, noMenu: false, fixa: true,
    blocos: [
      cab('Mapa do site', 'Mapa do site', 'Todas as páginas do site em um lugar só.'),
      { id: id(), tipo: 'mapa' },
    ],
  },
]
