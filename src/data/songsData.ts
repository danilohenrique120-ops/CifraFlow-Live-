import { Song, Setlist, GenreFolder } from '../types';

export const CATALOG_VERSION = 'v5_empty_catalog_dynamic_folders';

export const PRESET_SONG_IDS = new Set<string>([
  'tempo-perdido',
  'anunciacao',
  'evidencias',
  'pe-na-areia',
  'gostava-tanto-de-voce',
  'whisky-a-go-go',
  'lanterna-dos-afogados',
  'dormi-na-praca',
  'ainda-gosto-de-voce',
  'porque-ele-vive',
  'raridade',
  'xote-dos-milagres',
  'flor-e-o-beija-flor',
  'meu-abrigo',
  'sinonimos',
  'asa-branca',
  'te-louvarei',
  'proibida-pra-mim',
  'como-nossos-pais',
  'deus-de-promessas',
  'cheia-de-manias',
  'o-sol'
]);

export const INITIAL_GENRE_FOLDERS: GenreFolder[] = [
  {
    id: 'folder_pop_rock',
    name: 'Pop Rock',
    color: 'from-blue-600 to-indigo-900',
    desc: 'Clássicos e hits do rock nacional e internacional'
  },
  {
    id: 'folder_mpb',
    name: 'MPB',
    color: 'from-amber-600 to-orange-800',
    desc: 'Voz e violão, samba e canções da música brasileira'
  },
  {
    id: 'folder_sertanejo',
    name: 'Sertanejo',
    color: 'from-amber-700 to-yellow-900',
    desc: 'Sertanejo clássico, universitário e modas de viola'
  }
];

export const INITIAL_SONGS: Song[] = [];

export const PRESET_CATALOG_SONGS: Song[] = [
  {
    id: 'tempo-perdido',
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 124,
    timeSignature: '4/4',
    liturgicalMoment: 'Pop Rock',
    categories: ['Pop Rock', 'Anos 80/90', 'Clássicos'],
    coverGradient: 'from-blue-600 to-indigo-900',
    tags: ['rock', 'legiao', 'nacional', 'anos 80', 'pop rock'],
    duration: '5:02',
    content: `[Intro] C  Am7  Bm  Em

[Primeira Parte]
C             Am7
 Todos os dias quando acordo
Bm              Em
 Não tenho mais o tempo que passou
C             Am7
 Mas tenho muito tempo
Bm              Em
 Temos todo o tempo do mundo

[Segunda Parte]
C             Am7
 Todos os dias antes de dormir
Bm              Em
 Lembro e esqueço como foi o dia
C             Am7
 Sempre em frente
Bm              Em
 Não temos tempo a perder

[Refrão]
C             Am7
 Nosso suor sagrado
Bm                  Em
 É bem mais belo que esse sangue amargo
C           Am7
 E tão sério
Bm      Em
 E selvagem

[Ponte]
C           Am7
 Veja o sol dessa manhã tão cinza
Bm               Em
 A tempestade que chega é da cor dos teus olhos
C        Am7      Bm     Em
 Castanhos...

[Refrão Final]
C             Am7
 Então me abraça forte
Bm               Em
 E me diz mais uma vez que já estamos
C        Am7
 Distantes de tudo
Bm           Em
 Temos nosso próprio tempo`
  },
  {
    id: 'anunciacao',
    title: 'Anunciação',
    artist: 'Alceu Valença',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 110,
    timeSignature: '4/4',
    liturgicalMoment: 'MPB',
    categories: ['MPB', 'Forró', 'Clássicos'],
    coverGradient: 'from-amber-500 to-orange-700',
    tags: ['mpb', 'nordeste', 'alceu', 'tu vens', 'acustico'],
    duration: '4:20',
    content: `[Intro] C  Dm  F  C

[Primeira Parte]
C
 Na bruma leve das paixões
    Dm
Que vêm de dentro
F
 Tu vens chegando pra brincar
      C
No meu quintal

C
 No teu cavalo peito nu
   Dm
Cabelo ao vento
F
 E o sol quarando nossas roupas
   C
No varal

[Refrão]
C
 Tu vens, tu vens
Dm           F
 Eu já escuto os teus sinais
C
 Tu vens, tu vens
Dm           F         C
 Eu já escuto os teus sinais

[Segunda Parte]
C
 A voz do anjo sussurrou
    Dm
No meu ouvido
F
 Eu não duvido, já escuto
   C
Os teus sinais

C
 Que tu virias numa manhã
    Dm
De domingo
F
 Eu rezo e peço pra você
   C
Chegar mais cedo

[Refrão Final]
C
 Tu vens, tu vens
Dm           F
 Eu já escuto os teus sinais
C
 Tu vens, tu vens
Dm           F         C
 Eu já escuto os teus sinais`
  },
  {
    id: 'evidencias',
    title: 'Evidências',
    artist: 'Chitãozinho & Xororó',
    originalKey: 'E',
    currentKey: 'E',
    bpm: 78,
    timeSignature: '4/4',
    liturgicalMoment: 'Sertanejo',
    categories: ['Sertanejo', 'Romântica', 'Hits do Show'],
    coverGradient: 'from-amber-600 to-yellow-800',
    tags: ['sertanejo', 'hino', 'chitaozinho', 'evidencias', 'karaoke'],
    duration: '4:39',
    content: `[Intro] E  B/D#  C#m7  B  A  B7

[Primeira Parte]
E                      B/D#
 Quando eu digo que deixei de te amar
C#m7                   B
 É porque eu te amo
A                      E/G#
 Quando eu digo que não quero mais você
F#m7                   B7
 É porque eu te quero

[Segunda Parte]
E                  B/D#
 Eu tenho medo de te dar meu coração
C#m7               B
 E confessar que eu estou em tuas mãos
A                  E/G#
 Mas não posso esconder a verdade
F#m7                 B7
 Que eu me perco no teu olhar

[Refrão]
             E
E nessa loucura de dizer que não te quero
          B/D#
Vou negando as aparências
                C#m7
Disfarçando as evidências
         B                  A
Mas pra que viver fingindo, se eu não posso
F#m7          B7
Enganar meu coração?
            E
Eu sei que te amo!
              B/D#
Chega de mentiras, de negar o meu desejo
          C#m7
Eu te quero mais que tudo
          B
Eu preciso do teu beijo
A           B7          E
 Eu entrego a minha vida pra você!`
  },
  {
    id: 'pe-na-areia',
    title: 'Pé na Areia',
    artist: 'Diogo Nogueira',
    originalKey: 'G',
    currentKey: 'G',
    bpm: 96,
    timeSignature: '2/4',
    liturgicalMoment: 'Pagode & Samba',
    categories: ['Pagode', 'Ao Vivo', 'Hits do Show'],
    coverGradient: 'from-emerald-500 to-teal-800',
    tags: ['samba', 'pagode', 'praia', 'diogo nogueira', 'roda de samba'],
    duration: '3:45',
    content: `[Intro] G  D7  Em7  C  D7

[Primeira Parte]
G
 Vamos pular a parte que eu peço
     D7
A sua mão e você diz que sim
Em7
 Vamos pular a parte que a gente
   C            D7
Aluga um apê na praia

[Segunda Parte]
G
 Que a gente já tá velhinho
   D7
Gozando a aposentadoria
Em7
 Tomando caipirinha
      C         D7
E ouvindo um pagodinho

[Refrão]
G
 Pé na areia, caipirinha
D7
 Água de coco, a cervejinha
Em7
 Pé na areia, caipirinha
C              D7
 Água de coco, a cervejinha
G
 E um amor pra chamar de meu!`
  },
  {
    id: 'gostava-tanto-de-voce',
    title: 'Gostava Tanto de Você',
    artist: 'Tim Maia',
    originalKey: 'D',
    currentKey: 'D',
    bpm: 72,
    timeSignature: '4/4',
    liturgicalMoment: 'MPB',
    categories: ['MPB', 'Baladas & Românticas', 'Clássicos'],
    coverGradient: 'from-purple-600 to-indigo-900',
    tags: ['soul', 'tim maia', 'mpb', 'romantica', 'nostalgia'],
    duration: '4:15',
    content: `[Intro] D  F#m7  G  A7

[Primeira Parte]
D                  F#m7
 Não sei porque você se foi
G                  A7
 Quantas saudades eu senti
D                  F#m7
 E de tristeza vou viver
G                  A7
 Aquele adeus não pude dar

[Pré-Refrão]
Em7                F#m7
 Você marcou na minha vida
G                  A7
 Viveu, morreu na minha história
Em7                F#m7
 Chego a chorar se me lembro
G                  A7
 Do tempo que não volta mais

[Refrão]
     D    F#m7
Eu gostava tanto de você!
     G    A7
Eu gostava tanto de você!
     D    F#m7
Eu gostava tanto de você!
     G    A7          D
Eu gostava tanto de você!`
  },
  {
    id: 'whisky-a-go-go',
    title: 'Whisky a Go-Go',
    artist: 'Roupa Nova',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 130,
    timeSignature: '4/4',
    liturgicalMoment: 'Hits do Show',
    categories: ['Pop Rock', 'Hits do Show', 'Anos 80/90'],
    coverGradient: 'from-rose-600 to-pink-900',
    tags: ['festa', 'roupa nova', 'show', 'anos 80', 'pop'],
    duration: '4:08',
    content: `[Intro] C  G/B  Am7  F  G

[Primeira Parte]
C             G/B
 Foi num baile, meia-luz
Am7           Em
 Que eu te conheci
F             C/E
 Um beijo na boca
Dm7           G
 E tudo começou

[Refrão]
C             G/B
 Eu perguntava: Do you wanna dance?
Am7           Em
 E te abraçava: Do you wanna dance?
F             C/E
 Lembra daquele som que rolava?
Dm7           G
 É o meu coração que tocava!

[Segunda Parte]
C             G/B
 Um whisky a go-go
Am7           Em
 Naquele salão
F             C/E
 E a gente dançando
Dm7           G
 Até o sol raiar!`
  },
  {
    id: 'lanterna-dos-afogados',
    title: 'Lanterna dos Afogados',
    artist: 'Os Paralamas do Sucesso',
    originalKey: 'Em',
    currentKey: 'Em',
    bpm: 80,
    timeSignature: '4/4',
    liturgicalMoment: 'Pop Rock',
    categories: ['Pop Rock', 'Anos 80/90', 'Clássicos'],
    coverGradient: 'from-blue-800 to-slate-900',
    tags: ['paralamas', 'herbert vianna', 'rock nacional'],
    duration: '3:50',
    content: `[Intro] Em  C  Am  B7

[Primeira Parte]
Em
 Quando tá escuro e ninguém te ouve
C
 Quando não há forças pra você pedir
Am
 Quando o desespero bate à sua porta
B7
 E não há mais ninguém por perto

[Refrão]
Em
 Eu tô ligando a lanterna dos afogados
C
 Pra te mostrar que nem tudo tá perdido
Am
 Que o amor que a gente tem guardado
B7               Em
 Ainda pode nos salvar!`
  },
  {
    id: 'dormi-na-praca',
    title: 'Dormi na Praça',
    artist: 'Bruno & Marrone',
    originalKey: 'D',
    currentKey: 'D',
    bpm: 82,
    timeSignature: '4/4',
    liturgicalMoment: 'Sertanejo',
    categories: ['Sertanejo', 'Hits do Show'],
    coverGradient: 'from-amber-700 to-orange-950',
    tags: ['bruno marrone', 'sertanejo', 'guarda', 'dormi na praca'],
    duration: '3:30',
    content: `[Intro] D  A/C#  Bm  G  A7

[Primeira Parte]
D                 A/C#
 Eu caminhei sozinho pela rua
Bm                F#m
 Falei com as estrelas e com a lua
G                 D/F#
 Deitei no banco da praça
Em7               A7
 Tentando te esquecer

[Refrão]
D
 Seu guarda, eu não sou vagabundo
A/C#
 Eu não sou delinquente
Bm
 Sou um homem carente
G
 Que perdeu a grande
A7             D
 Esperança da sua vida!`
  },
  {
    id: 'boate-azul',
    title: 'Boate Azul',
    artist: 'Milionário & José Rico',
    originalKey: 'Am',
    currentKey: 'Am',
    bpm: 90,
    timeSignature: '3/4',
    liturgicalMoment: 'Sertanejo',
    categories: ['Sertanejo', 'Clássicos'],
    coverGradient: 'from-blue-900 to-indigo-950',
    tags: ['boate azul', 'sertanejo raiz', 'classico'],
    duration: '3:20',
    content: `[Intro] Am  E7  Am  E7  Am

[Primeira Parte]
Am                               E7
 Doente de amor, procurei remédio na vida noturna
                                               Am
Com a flor da noite, numa boate aqui na zona sul
                                   A7          Dm
A dor do amor é com outro amor que a gente cura
                        Am        E7          Am
Vim curar a dor desse mal de amor na Boate Azul

[Refrão]
             E7
Sair de que jeito, se eu nem sei o rumo
          Am
Para onde vou?
          E7
Muito embriagado, que nem meus passos
         Am
Eu sinto no chão
             Dm                      Am
Garçom, me ajude aqui no meu primeiro passo
            E7                         Am
Até o meu carro, é meu dia de desilusão!`
  },
  {
    id: 'deixa-acontecer',
    title: 'Deixa Acontecer',
    artist: 'Grupo Revelação',
    originalKey: 'F',
    currentKey: 'F',
    bpm: 98,
    timeSignature: '2/4',
    liturgicalMoment: 'Pagode & Samba',
    categories: ['Pagode', 'Ao Vivo', 'Clássicos'],
    coverGradient: 'from-teal-600 to-emerald-900',
    tags: ['pagode', 'revelacao', 'xande', 'deixa acontecer'],
    duration: '4:02',
    content: `[Intro] F  C7  Bb  C7

[Primeira Parte]
F            C7
 Deixa acontecer naturalmente
Bb           C7
 Eu não quero ver você chorar
F            C7
 Deixa que o amor encontre a gente
Bb           C7
 Nosso caso vai se eternizar

[Refrão]
F             C7
 Você já é o meu xodó
Bb            C7
 Não tem como disfarçar
F             C7
 O nosso amor é de verdade
Bb            C7       F
 E nada vai nos separar!`
  },
  {
    id: 'ta-escrito',
    title: 'Tá Escrito',
    artist: 'Grupo Revelação (Xande de Pilares)',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 102,
    timeSignature: '2/4',
    liturgicalMoment: 'Pagode & Samba',
    categories: ['Pagode', 'Hits do Show', 'Ao Vivo'],
    coverGradient: 'from-emerald-600 to-yellow-800',
    tags: ['xande', 'ta escrito', 'samba', 'pagode', 'guerreiro'],
    duration: '3:50',
    content: `[Intro] C  G7  Am  F  G7

[Primeira Parte]
C
 Quem cultiva a semente do amor
G7
 Segue em frente e não se apavora
Am
 Se na vida encontrar dissabor
F                 G7
 Vai saber com a dor conviver

[Refrão]
C
 Ergue essa cabeça, mete o pé e vai na fé
G7
 Manda essa tristeza embora
Am
 Basta acreditar que um novo dia vai raiar
F            G7      C
 Sua hora vai chegar!`
  },
  {
    id: 'primeiros-erros',
    title: 'Primeiros Erros',
    artist: 'Capital Inicial (Kiko Zambianchi)',
    originalKey: 'G',
    currentKey: 'G',
    bpm: 116,
    timeSignature: '4/4',
    liturgicalMoment: 'Pop Rock',
    categories: ['Pop Rock', 'Acústico', 'Anos 80/90'],
    coverGradient: 'from-blue-700 to-indigo-950',
    tags: ['capital inicial', 'rock nacional', 'chove la fora', 'acustico'],
    duration: '4:30',
    content: `[Intro] G  D/F#  Em7  C9

[Primeira Parte]
G              D/F#
 Meu caminho é cada manhã
Em7            C9
 Não procuro saber onde vou
G              D/F#
 Meu destino não é de ninguém
Em7            C9
 E eu não deixo os meus passos no chão

[Refrão]
G              D/F#
 Se o sol nascer no horizonte
Em7            C9
 E a chuva molhar o meu rosto
G              D/F#
 Mas se for pra recomeçar
Em7            C9
 Eu começo outra vez!`
  },
  {
    id: 'oceano',
    title: 'Oceano',
    artist: 'Djavan',
    originalKey: 'D',
    currentKey: 'D',
    bpm: 68,
    timeSignature: '4/4',
    liturgicalMoment: 'MPB',
    categories: ['MPB', 'Baladas & Românticas', 'Clássicos'],
    coverGradient: 'from-teal-700 to-cyan-950',
    tags: ['djavan', 'mpb', 'violao', 'oceano'],
    duration: '4:50',
    content: `[Intro] D  Em7  F#m7  G  A7

[Primeira Parte]
D                    Em7
 Assim que o dia amanheceu
F#m7                 G
 Lá no mar alto da paixão
D                    Em7
 Dava pra ver o tempo mudar
F#m7                 G
 Se afastar da solidão

[Refrão]
D               F#m7
 Amar é um deserto e seus temores
G                    A7
 Vida que vai na sela dessas dores
D               F#m7
 Só você pra me dar a certeza
G             A7         D
 Do oceano da minha beleza!`
  },
  {
    id: 'sozinho',
    title: 'Sozinho',
    artist: 'Caetano Veloso (Peninha)',
    originalKey: 'G',
    currentKey: 'G',
    bpm: 65,
    timeSignature: '4/4',
    liturgicalMoment: 'Acústico',
    categories: ['MPB', 'Acústico', 'Romântica'],
    coverGradient: 'from-amber-800 to-zinc-900',
    tags: ['caetano', 'peninha', 'sozinho', 'voz e violao'],
    duration: '3:40',
    content: `[Intro] G  Bm7  C  D7

[Primeira Parte]
G               Bm7
 Às vezes no silêncio da noite
C                      D7
 Eu fico imaginando nós dois
G                Bm7
 Eu fico vendo o sol se apagar
C                  D7
 E a escuridão me abraçar

[Refrão]
G            Bm7
 Quando a gente gosta é claro que a gente cuida
C                 D7
 Fala que me ama, só não joga fora
G                 Bm7
 Porque quando a gente perde um amor
C             D7         G
 Fica sem saber pra onde ir!`
  },
  {
    id: 'a-casa-e-sua',
    title: 'A Casa É Sua',
    artist: 'Casa Worship',
    originalKey: 'G',
    currentKey: 'G',
    bpm: 70,
    timeSignature: '4/4',
    liturgicalMoment: 'Gospel & Louvor',
    categories: ['Gospel', 'Adoração', 'Louvor'],
    coverGradient: 'from-amber-600 to-emerald-800',
    tags: ['gospel', 'casa worship', 'louvor', 'adoracao'],
    duration: '6:15',
    content: `[Intro] G  C9  Em7  D

[Primeira Parte]
G
 Você é bem-vindo aqui
C9
 A casa é Sua, pode entrar
Em7
 Me esvazio de mim
D
 Pra que Tu possas reinar

[Refrão]
G
 Essa casa é Sua casa
C9
 Nós deixamos ela pra Você, Jesus
Em7
 Essa casa é Sua casa
D
 Nós deixamos ela pra Você!`
  },
  {
    id: 'raridade',
    title: 'Raridade',
    artist: 'Anderson Freire',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 68,
    timeSignature: '4/4',
    liturgicalMoment: 'Gospel & Louvor',
    categories: ['Gospel', 'Adoração'],
    coverGradient: 'from-violet-700 to-indigo-950',
    tags: ['anderson freire', 'raridade', 'gospel'],
    duration: '4:45',
    content: `[Intro] C  G/B  Am  F

[Primeira Parte]
C                 G/B
 Não consigo entender como Tu me amas tanto
Am                F
 Sendo eu tão falho e imperfeito assim
C                 G/B
 Mas a Tua graça me alcançou no abismo
Am                F
 E mudou a minha história

[Refrão]
C
 Você é um espelho que reflete a imagem do Senhor
G/B
 Não chore se o mundo ainda não notou
Am
 Já é o bastante Deus reconhecer o seu valor
F
 Você é precioso, mais raro que o ouro puro de Ofir!`
  },
  {
    id: 'ninguem-te-ama-como-eu',
    title: 'Ninguém Te Ama Como Eu',
    artist: 'Martín Valverde',
    originalKey: 'C',
    currentKey: 'C',
    bpm: 68,
    timeSignature: '4/4',
    liturgicalMoment: 'Gospel & Louvor',
    categories: ['Gospel', 'Adoração', 'Clássicos'],
    coverGradient: 'from-amber-600 to-rose-700',
    tags: ['comunhao', 'adoracao', 'amor', 'jesus'],
    duration: '5:12',
    content: `[Intro] C  G/B  Am  Am/G  F  G  C  G7

[Primeira Parte]
C            G/B           Am   Am/G
 Tenho esperado este momento
F            Dm               G4   G
 Tenho esperado que viesses a mim
C            G/B          Am   Am/G
 Tenho esperado que me fales
F            Dm           G4   G
 Tenho esperado que estivesses assim

[Refrão]
             C     G/B        Am   Am/G
Ninguém te ama como eu, ninguém te ama como eu
      F               Dm           G4   G
Olha pra cruz, esta é a minha grande prova
             C     G/B        Am   Am/G
Ninguém te ama como eu, ninguém te ama como eu
      F               Dm           G4   G
Olha pra cruz, foi por ti, porque te amo
             C     G/B  Am  Am/G  F  G  C
Ninguém te ama como eu`
  },
  {
    id: 'lugar-secreto',
    title: 'Lugar Secreto',
    artist: 'Gabriela Rocha',
    originalKey: 'D',
    currentKey: 'D',
    bpm: 72,
    timeSignature: '4/4',
    liturgicalMoment: 'Gospel & Louvor',
    categories: ['Gospel', 'Adoração'],
    coverGradient: 'from-violet-600 to-indigo-900',
    tags: ['gabriela rocha', 'gospel', 'adoracao'],
    duration: '5:40',
    content: `[Intro] D  A/C#  Bm7  G

[Primeira Parte]
D
 Tu és tudo o que eu mais quero
A/C#
 O meu refúgio e proteção
Bm7
 No Teu altar me coloco
G
 Pra ouvir o Teu coração

[Refrão]
D
 Leva-me ao lugar secreto
A/C#
 Onde a Tua glória habita
Bm7
 Eu quero Te conhecer mais
G
 E viver da Tua presença!`
  },
  {
    id: 'esperando-na-janela',
    title: 'Esperando na Janela',
    artist: 'Gilberto Gil',
    originalKey: 'G',
    currentKey: 'G',
    bpm: 104,
    timeSignature: '2/4',
    liturgicalMoment: 'Forró & Piseiro',
    categories: ['Forró', 'MPB', 'Clássicos'],
    coverGradient: 'from-orange-500 to-amber-800',
    tags: ['forro', 'gilberto gil', 'xote', 'nordeste'],
    duration: '4:20',
    content: `[Intro] G  D7  G  D7

[Primeira Parte]
G
 Ainda lembro daquela noite
             D7
Que você me olhou
Com aquele sorriso lindo
              G
Que me conquistou

[Refrão]
G
 Por isso eu fico esperando na janela
          D7
Pra ver se você passa por aqui
E quando você vem toda bela
            G
Eu fico tão feliz!`
  },
  {
    id: 'rindo-a-toa',
    title: 'Rindo à Toa',
    artist: 'Falamansa',
    originalKey: 'A',
    currentKey: 'A',
    bpm: 112,
    timeSignature: '2/4',
    liturgicalMoment: 'Forró & Piseiro',
    categories: ['Forró', 'Ao Vivo', 'Hits do Show'],
    coverGradient: 'from-amber-500 to-red-800',
    tags: ['falamansa', 'xote', 'forro universitario', 'alegria'],
    duration: '3:45',
    content: `[Intro] A  E7  F#m  D  E7

[Primeira Parte]
A              E7
 Tô numa boa, tô rindo à toa
F#m            D       E7
 A vida é bela e eu vou vivendo assim
A              E7
 Com um sorriso no meu rosto
F#m            D       E7
 Deixo a tristeza lá no fim

[Refrão]
A               E7
 Há há há há há, mas eu tô rindo à toa
F#m             D       E7
 Não quero saber de nada, a vida é boa!`
  },
  {
    id: 'como-e-grande-o-meu-amor',
    title: 'Como É Grande o Meu Amor Por Você',
    artist: 'Roberto Carlos',
    originalKey: 'A',
    currentKey: 'A',
    bpm: 66,
    timeSignature: '4/4',
    liturgicalMoment: 'Baladas & Românticas',
    categories: ['Romântica', 'Baladas & Românticas', 'Clássicos'],
    coverGradient: 'from-rose-700 to-purple-950',
    tags: ['roberto carlos', 'romantica', 'casamento', 'classico'],
    duration: '3:30',
    content: `[Intro] A  C#m  D  E7

[Primeira Parte]
A                  C#m
 Eu tenho tanto pra lhe falar
D                  E7
 Mas com palavras não sei dizer
A                  C#m
 Como é grande o meu amor
D         E7    A
 Por você!

[Refrão]
E7              A
 Nem mesmo o céu, nem as estrelas
C#m            D
 Nem mesmo o mar e o infinito
E7             A
 Não é maior que o meu amor
C#m          D     E7      A
 Nem mais bonito!`
  },
  {
    id: 'stand-by-me',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    originalKey: 'A',
    currentKey: 'A',
    capo: 2,
    bpm: 118,
    timeSignature: '4/4',
    liturgicalMoment: 'Acústico',
    categories: ['Internacional', 'Acústico', 'Clássicos'],
    coverGradient: 'from-cyan-600 to-blue-900',
    tags: ['internacional', 'classico', 'acustico', 'soul', 'capo'],
    duration: '3:00',
    content: `[Capotraste na 2ª casa]
[Intro] G  Em  C  D7  G

[Primeira Parte]
G
 When the night has come
Em
 And the land is dark
        C          D7              G
And the moon is the only light we'll see

[Segunda Parte]
G
 No I won't be afraid,
Em
 Oh, I won't be afraid
        C            D7           G
Just as long as you stand, stand by me

[Refrão]
             G
So darling, darling, stand by me,
Em
 Oh, stand by me
    C      D7        G
Oh, stand, stand by me, stand by me`
  }
];

export const INITIAL_SETLISTS: Setlist[] = [
  {
    id: 'show-sexta-acustico',
    title: 'Show de Sexta - Barzinho Acústico',
    description: 'Setlist completo para voz e violão com grandes sucessos nacionais e internacionais.',
    date: 'Sexta-feira 21:00',
    targetEvent: 'Barzinho / Voz e Violão',
    items: [
      { songId: 'anunciacao', customKey: 'C', order: 1, notes: 'Abertura animada com violão e percussão' },
      { songId: 'tempo-perdido', customKey: 'C', order: 2, notes: 'Entrada com dinâmica crescente' },
      { songId: 'gostava-tanto-de-voce', customKey: 'D', order: 3, notes: 'Momento romântico' },
      { songId: 'sozinho', customKey: 'G', order: 4, notes: 'Voz suave e violão' },
      { songId: 'primeiros-erros', customKey: 'G', order: 5, notes: 'Refrão com o público cantando junto' },
      { songId: 'stand-by-me', customKey: 'A', order: 6, notes: 'Bis e encerramento' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCloudSynced: true
  },
  {
    id: 'noite-pop-rock',
    title: 'Noite de Pop Rock & Hits',
    description: 'Repertório com clássicos do rock nacional e músicas de alta energia para a banda.',
    date: 'Sábado 22:00',
    targetEvent: 'Show / Apresentação',
    items: [
      { songId: 'tempo-perdido', customKey: 'C', order: 1, notes: 'Intro marcante na bateria e guitarra' },
      { songId: 'lanterna-dos-afogados', customKey: 'Em', order: 2, notes: 'Balada rock com dinâmica' },
      { songId: 'primeiros-erros', customKey: 'G', order: 3, notes: 'Solo de guitarra no final' },
      { songId: 'whisky-a-go-go', customKey: 'C', order: 4, notes: 'Ponto alto do show - agitar o público!' },
      { songId: 'evidencias', customKey: 'E', order: 5, notes: 'Hino nacional do palco!' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCloudSynced: true
  },
  {
    id: 'roda-de-samba-pagode',
    title: 'Roda de Samba & Pagode Acústico',
    description: 'Repertório com o melhor do samba de raiz, pagode e clássicos para animar.',
    date: 'Domingo 16:00',
    targetEvent: 'Festa / Evento',
    items: [
      { songId: 'pe-na-areia', customKey: 'G', order: 1, notes: 'Clima descontraído de praia' },
      { songId: 'deixa-acontecer', customKey: 'F', order: 2, notes: 'Roda cantando junto' },
      { songId: 'ta-escrito', customKey: 'C', order: 3, notes: 'Mensagem de positividade e animação' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCloudSynced: true
  }
];
