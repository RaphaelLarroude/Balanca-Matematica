# 🔢 Balança Matemática

Uma ferramenta interativa e educacional para aprender sobre igualdade e expressões matemáticas através de uma balança dinâmica.

## ✨ Características

- **Interface Intuitiva**: Crie blocos com expressões matemáticas e equilibre-os como em uma balança real
- **Variáveis Dinâmicas**: Defina e manipule variáveis para explorar diferentes cenários matemáticos
- **Auto-Equilibramento**: Use o algoritmo inteligente para encontrar automaticamente o valor da variável que equilibra a balança
- **Design Responsivo**: Funciona perfeitamente em desktop e dispositivos móveis
- **Expressões Flexíveis**: Suporte para expressões matemáticas complexas com múltiplas variáveis

## 🚀 Como Usar

### Instalação

```bash
# Clone o repositório
git clone https://github.com/RaphaelLarroude/Balanca-Matematica.git
cd Balanca-Matematica

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Construir para Produção

```bash
npm run build
```

## 📋 Como Funciona

1. **Criar Blocos**: Digite uma expressão matemática (ex: `2x`, `5`, `3x + 2`) no campo "Novo Bloco" e pressione Enter
2. **Arrastrar para a Balança**: Arraste os blocos do banco ("Seus Blocos") para os lados esquerdo ou direito da balança
3. **Definir Variáveis**: Na seção de variáveis, defina valores para as variáveis usadas nas expressões
4. **Auto-Equilibrar**: Clique em "Auto-Equilibrar" para encontrar automaticamente o valor de uma variável que equilibra a balança
5. **Resetar**: Use o botão "Resetar" para limpar toda a balança e começar novamente

## 🛠️ Tecnologias

- **React 19** - Framework de UI
- **TypeScript** - Tipagem de dados
- **Vite** - Build tool e dev server
- **Lucide React** - Ícones
- **Tailwind CSS** - Estilização (inferido)

## 📦 Estrutura do Projeto

```
Balança-Matemática/
├── src/
│   ├── components/
│   │   ├── BalanceScale.tsx      # Componente da balança visual
│   │   └── MathBlock.tsx         # Componente de bloco matemático
│   ├── utils/
│   │   └── math.ts               # Utilitários de cálculo matemático
│   ├── App.tsx                   # Componente principal
│   ├── types.ts                  # Tipos TypeScript
│   ├── index.tsx                 # Ponto de entrada
│   └── index.html                # HTML principal
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Exemplos de Uso

### Exemplo 1: Equação Simples
```
Lado Esquerdo: 2x
Lado Direito: 10

Auto-Equilibrar → x = 5
```

### Exemplo 2: Múltiplos Blocos
```
Lado Esquerdo: 3x, 5
Lado Direito: 2x, 20

Auto-Equilibrar → x = 15
```

### Exemplo 3: Expressões Complexas
```
Lado Esquerdo: 2x + 3
Lado Direito: x + 8

Auto-Equilibrar → x = 5
```

## 📱 Responsividade

A aplicação é totalmente responsiva:
- **Mobile**: Interface otimizada com controles em abas deslizáveis
- **Tablet**: Layout ajustado mantendo funcionalidade
- **Desktop**: Layout completo com todos os controles visíveis

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Todos os direitos reservados © 2025 Raphael Costa

## 👨‍💻 Autor

**Raphael Costa** - [GitHub](https://github.com/RaphaelLarroude)

---

Feito com ❤️ para o site Balança Matemática
