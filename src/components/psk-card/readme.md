# psk-card



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default |
| -------- | --------- | ----------- | -------- | ------- |
| `id`     | `id`      |             | `string` | `""`    |
| `title`  | `title`   |             | `string` | `""`    |


## Dependencies

### Used by

 - [psk-barcode-generator](../psk-barcode/psk-barcode-generator)
 - [psk-chapter](../psk-chapter)
 - [psk-description](../psk-description)
 - [psk-toc](../psk-toc)

### Depends on

- [psk-copy-clipboard](../psk-copy-clipboard)

### Graph
```mermaid
graph TD;
  psk-card --> psk-copy-clipboard
  psk-barcode-generator --> psk-card
  psk-chapter --> psk-card
  psk-description --> psk-card
  psk-toc --> psk-card
  style psk-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
