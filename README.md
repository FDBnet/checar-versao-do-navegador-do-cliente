# Checar Versão do Navegador do Cliente
Código em JS para verificar a versão do navegador do cliente e permitir que o Dev tome decisões a partir disso. Este código é extremamente leve e compatível inclusive com Internet Explorer (IE) 11.

## Descrição

Este projeto fornece uma ferramenta JavaScript leve e eficiente para verificar o suporte do navegador a algo, como a algum recurso específico. Ele é projetado para funcionar em uma ampla gama de dispositivos, desde navegadores modernos até dispositivos antigos com recursos limitados.

## Características

- Detecção automática do navegador e versão
- Mensagens personalizadas para diferentes níveis de suporte
- Links para atualização do navegador (quando aplicável)
- Otimizado para performance e baixo consumo de recursos
- Compatível com navegadores antigos (incluindo IE11)
- Armazenamento local para evitar verificações repetidas

## Como Usar

1. Inclua o script em seu HTML:

```html
<script src="checarNavegadorCliente.js"></script>
```

2. Adicione um elemento para exibir as mensagens ao cliente:
```html
<div id="infos-sobre-cliente"></div>
```

3. Execute a verificação:
```html
<script>
var verificar = checarNavegador();
</script>
```


## Resultados
O script retorna um objeto com as seguintes propriedades:

- `s`: Nível de suporte (0: não suportado, 1: suporte mínimo, 2: suporte completo)
- `j`: JavaScript habilitado (sempre true se o script estiver rodando)
- `f`: Suporte completo (true se `s == 2`)
- `m`: Suporte mínimo (true se `s >= 1`)

## Compatibilidade
Este script é otimizado para funcionar em uma ampla gama de dispositivos, incluindo:

## Navegadores modernos (Chrome, Firefox, Safari, Edge, etc.)
Navegadores antigos (incluindo IE11)
Dispositivos com recursos limitados (até 4MB de RAM)

## Segurança
O script utiliza práticas seguras de programação, evitando vulnerabilidades comuns como injeção de script.

## Contribuições
Contribuições são bem-vindas! Por favor, sinta-se à vontade para submeter pull requests ou abrir issues para sugestões e melhorias.

## Licença
MIT License
