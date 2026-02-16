# YouTube Mouse Master

Script de melhoria de interação para o player do YouTube projetado para usuários avançados. Este é um script Tampermonkey altamente otimizado, sem sobreposição (Zero-Overlay) e altamente personalizável.

## ✨ Principais Características

* **Controles Rápidos**: Defina zonas de ação personalizadas no player que correspondem a ações do mouse, como cliques e rolagem da roda, para ajustar rapidamente volume, velocidade, progresso, etc.

* **Zonas de Ação Personalizadas**: Suporta configurações de zonas sensoras altamente personalizáveis, permitindo ajustar livremente o tamanho e a posição da zona (o padrão fornece as configurações de zonas Esquerda, Centro e Direita).

* **Interação Sem Sobreposição (Zero-Overlay)**: Abandona as tradicionais camadas transparentes e utiliza cálculos de coordenadas de alto desempenho, garantindo que não haja interferência nos cliques da interface nativa.

* **Otimização para Mac / Roda de Alta Frequência**: O mecanismo de filtragem integrado adapta-se perfeitamente ao MOS, SmoothScroll ou trackpads do Mac, evitando saltos excessivos por sensibilidade.

![DEMO SCREENSHOT](./demo.jpeg)

## ⚙️ Parâmetros Personalizáveis

Você pode ajustar as configurações diretamente nos blocos `SETTINGS` e `CONFIG` no topo do script.

### Configurações Globais (Global Settings)

| Parâmetro | Descrição | Padrão |
| :--- | :--- | :--- |
| `DEBUG` | Se deve exibir mensagens de depuração no Console | `false` |
| `ZONE_TOGGLE_KEY` | Tecla de atalho para alternar a visibilidad das zonas | `F9` |
| `OSD_DURATION` | Tempo que os avisos OSD permanecem na tela (ms) | `800` |
| `OSD_FADE_OUT` | Duração da animação de fade-out do OSD (ms) | `150` |
| `OSD_FONT_SIZE` | Tamanho da fonte do texto OSD (suporta px, em, rem, etc.) | `28px` |
| `USE_WHEEL_COUNT_FIXED` | Se deve ativar a filtragem de contagem de roda fixa (Recomendado para Mac) | `false` |
| `WHEEL_DELAY` | Tempo de atraso de debounce para eventos de roda (ms) | `1` |
| `WHEEL_COUNT_THRESHOLD` | Limite de acionamento: quantos eventos de roda acumular antes de agir | `14` |

### Configuração de Zonas (Custom Zone Configuration)

Você pode personalizar totalmente as zonas de ação conforme suas necessidades, ajustando o tamanho e a posição.

O padrão fornece configurações para as zonas Esquerda, Centro e Direita:

| Zona | Clique Esquerdo | Clique Direito | Ação da Roda |
| ----- | ----- | ----- | ----- |
| **Esquerda (Volume)** | Volume Máximo (100%) | Mudo Rápido (0%) | Passo de Volume +/- 5% |
| **Centro (Progresso)** | Nativo (Reproduzir/Pausar) | Nativo (Menu) | Salto de Progresso +/- 5s |
| **Direita (Velocidade)** | Rápido 2.0x | Redefinir 1.0x | Passo de Velocidade +/- 0.25x |

### Lista de Ações Suportadas (Supported Actions List)

Em `mouse_action`, os tipos de `action` que você pode usar são:

| Nome da Ação (action) | Descrição | Exemplo de Parâmetro (value) |
| :--- | :--- | :--- |
| `volume_up` | Aumentar volume | `5` (+5%) |
| `volume_down` | Diminuir volume | `5` (-5%) |
| `volume_set` | Definir volume fixo | `0` (Mudo) ou `100` (Máximo) |
| `volume_mute` | Alternar mudo | Sem parâmetro necessário |
| `seek` | Pular progresso | `5` (frente) ou `-5` (trás) |
| `toggle_play_pause` | Alternar estado de reprodução/pausa | Sem parâmetro necessário |
| `speed_up` | Aumentar velocidade | `0.25` |
| `speed_down` | Diminuir velocidade | `0.25` |
| `speed_set` | Definir velocidade fixa | `1.0`, `2.0`, etc. |
| `none` | Nenhuma ação | Passa o evento para o tratamento nativo do YouTube |

## 📦 Instalação

**Método 1: Instalação com um clique (Recomendado)**

1. Instale a extensão do navegador [Tampermonkey](https://www.tampermonkey.net/).
2. Visite a **[Página do Script no GreasyFork](https://greasyfork.org/en/scripts/566499-youtube-mouse-master)**.
3. Clique no botão **"Instalar este script"**.

**Método 2: Instalação manual**

1. Crie um "Novo script" no Tampermonkey.
2. Copie e cole o conteúdo de `YouTubeMouseMaster.user.js`.
3. Salve e aproveite!
