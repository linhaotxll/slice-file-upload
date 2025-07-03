import {
  GLOB_TSX,
  GLOB_VUE,
  combine,
  comments,
  ignores,
  imports,
  javascript,
  jsdoc,
  node,
  stylistic,
  typescript,
  unicorn,
  vue,
} from '@antfu/eslint-config'
import eslintImportPlugin from 'eslint-plugin-import'

/**
 * @type import('@antfu/eslint-config').StylisticConfig
 */
const stylisticOptions = { jsx: true }

// eslint-disable-next-line antfu/no-top-level-await
export default await combine(
  ignores(),
  javascript(),
  comments(),
  node(),
  jsdoc({ stylistic: stylisticOptions }),
  imports({ stylistic: stylisticOptions }),
  unicorn(),

  typescript({ componentExts: ['vue'] }),

  stylistic(stylisticOptions),
  vue({
    files: [GLOB_VUE, GLOB_TSX],
    typescript: true,
    overrides: {
      'vue/no-dupe-keys': 'error',
      'vue/first-attribute-linebreak': ['error', { singleline: 'ignore', multiline: 'below' }],
      'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      }],
      'vue/no-multi-spaces': ['error', {
        ignoreProperties: false,
      }],
      'vue/require-prop-types': 'error',
      'vue/no-required-prop-with-default': 'error',
    },
  }),

  // global ignore
  {
    ignores: ['public/**/*.js'],
  },

  // import order
  {
    plugins: {
      i: eslintImportPlugin,
    },
    rules: {
      'i/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'sibling',
            'parent',
            'index',
            'unknown',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // global styistic
  {
    rules: {

      'node/prefer-global/process': ['error', 'always'],

      // 数组方括号换行
      'style/array-bracket-newline': [
        'error',
        'consistent',
      ],

      // 数组方括号空格
      'style/array-bracket-spacing': [
        'error',
        'never',
      ],

      // 数组元素换行
      'style/array-element-newline': [
        'error',
        'consistent',
      ],

      // 箭头函数参数括号
      'style/arrow-parens': [
        'error',
        'as-needed',
        { requireForBlockBody: true },
      ],

      // 箭头函数 => 前后空格
      'style/arrow-spacing': [
        'error',
        { before: true, after: true },
      ],

      // 换行
      'style/block-spacing': [
        'error',
        'always',
      ],

      // 大括号样式
      'style/brace-style': [
        'error',
        '1tbs',
      ],

      // 尾随逗号
      'style/comma-dangle': ['error', 'always-multiline'],

      // 逗号前后空格
      'style/comma-spacing': ['error', { before: false, after: true }],

      // 逗号位置
      'style/comma-style': ['error', 'last'],

      // 计算属性中的空格
      'style/computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],

      // 访问成员 . 的位置
      'style/dot-location': ['error', 'property'],

      // 文件结尾插入换行
      'style/eol-last': ['error', 'always'],

      // 函数调用参数换行
      'style/function-call-argument-newline': ['error', 'consistent'],

      // 函数调用时函数名和括号间的空格
      'style/function-call-spacing': ['error', 'never'],

      // 函数参数换行
      'style/function-paren-newline': ['error', 'consistent'],

      // 生成器 * 位置
      'style/generator-star-spacing': ['error', 'after'],

      // 箭头函数返回值换行
      'style/implicit-arrow-linebreak': ['error', 'beside'],

      // jsx 缩进
      'style/jsx-indent': ['error', 2, {
        checkAttributes: true,
        indentLogicalExpressions: true,
      }],

      // 对象属性名使用引号;
      'style/quote-props': [
        'error',
        'as-needed',
        {
          numbers: true,
          keywords: false,
          unnecessary: true,
        },
      ],

      'style/object-curly-newline': ['off'],

      // 换行符样式
      'style/linebreak-style': [
        'error',
        'unix',
      ],

      // 链式调用
      'style/newline-per-chained-call': [
        'off',
      ],

      // 合法浮点数
      'style/no-floating-decimal': ['error'],

      // 大括号前的空格
      'style/space-before-blocks': ['error', 'always'],

      // 扩展符的空格
      'style/rest-spread-spacing': ['error', 'never'],

      // yield * 旁边空格
      'style/yield-star-spacing': ['error', 'after'],

      // 类成员间的换行
      'style/lines-between-class-members': ['error', 'always', { exceptAfterOverload: true }],

      // 禁止同时使用空格和制表
      'style/no-mixed-spaces-and-tabs': ['error'],

      // 属性冒号前后空格
      'style/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],

      // 关键字前后空格
      'style/keyword-spacing': ['error', { before: true, after: true }],

      // function 关键字前后空格
      'style/space-before-function-paren': ['error', 'always'],

      // 括号内的空格
      'style/space-in-parens': ['error', 'never'],

      // 运算符旁边的空格
      'style/space-infix-ops': ['error', { int32Hint: false }],

      // 一元运算符旁边空格
      'style/space-unary-ops': ['error', { words: true, nonwords: false }],

      // switch 冒号旁的空格
      'style/switch-colon-spacing': ['error', { after: true, before: false }],

      // 模板字符串空格
      'style/template-curly-spacing': ['error', 'never'],

      // 模板字符串名称空格
      'style/template-tag-spacing': ['error', 'never'],

      // iife 包裹
      'style/wrap-iife': ['error', 'inside'],

      // 一行最大字符数
      'style/max-len': ['error', {
        code: 120,
        tabWidth: 2,
        ignoreStrings: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreTemplateLiterals: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
      }],

      // 三元表达式换行
      'style/multiline-ternary': ['error', 'always-multiline'],

      // new 操作括号
      'style/new-parens': ['error', 'always'],

      // ts 接口、别名成员换行
      'style/member-delimiter-style': [
        'error',
        {
          multilineDetection: 'brackets',
          multiline: {
            delimiter: 'none',
            requireLast: false,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: true,
          },
        },
      ],

      // ts 声明类型旁边空格
      'style/type-annotation-spacing': ['error', { before: false, after: true }],

      // jsx 禁止表达式中出现空格
      'style/jsx-child-element-spacing': ['error'],

      // jsx 闭合标签 > 位置
      'style/jsx-closing-bracket-location': ['error', 'line-aligned'],

      // jsx 闭合标签对齐位置
      'style/jsx-closing-tag-location': ['error'],

      // jsx 使用大括号情况
      'style/jsx-curly-brace-presence': ['error', {
        props: 'never',
        children: 'never',
        propElementValues: 'always',
      }],

      // jsx 大括号内换行
      'style/jsx-curly-newline': ['error', 'consistent'],

      // jsx 大括号内空格
      'style/jsx-curly-spacing': ['error', { when: 'never', attributes: true, children: true }],

      // jsx = 旁边空格
      'style/jsx-equals-spacing': ['error', 'never'],

      // JSX 引号
      'style/jsx-quotes': ['error', 'prefer-double'],

      // jsx 第一个 props 位置
      'style/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],

      // jsx props 缩进
      'style/jsx-indent-props': ['error', 2],

      // jsx 换行
      'style/jsx-newline': ['error', { prevent: true, allowMultilines: true }],

      // 每行需要一个 jsx 元素
      'style/jsx-one-expression-per-line': ['error', { allow: 'literal' }],

      // jsx props 间只能有一个空格
      'style/jsx-props-no-multi-spaces': ['error'],

      // jsx 自闭和
      'style/jsx-self-closing-comp': ['error', { component: true, html: true }],

      // jsx tag 前后空格
      'style/jsx-tag-spacing': ['error', {
        closingSlash: 'never',
        beforeSelfClosing: 'always',
      }],

      // jsx 包裹括号
      'style/jsx-wrap-multilines': ['error', {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'ignore',
        logical: 'ignore',
        prop: 'ignore',
      }],

      // Jsx props 排序
      'style/jsx-sort-props': [
        'error',
        {
          ignoreCase: true,
          callbacksLast: true,
          shorthandFirst: true,
          multiline: 'ignore',
          reservedFirst: [
            'key',
            'ref',
            'children',
          ],
        },
      ],

      // 所有语句都包含大括号
      curly: ['error', 'all'],

      'no-restricted-syntax': [
        'error',
        // 必须使用 const enum
        {
          selector: 'TSEnumDeclaration:not([const=true])',
          message: 'Don\'t declare non-const enums',
        },
      ],

      // 允许使用 ts 注释
      'ts/ban-ts-comment': 'off',

      // 允许枚举值相同
      'ts/no-duplicate-enum-values': 'off',

      //

      // 禁止使用多个空格
      'style/no-multi-spaces': [
        'error',
        {
          ignoreEOLComments: true,
        },
      ],

      // 禁止多个空行
      'style/no-multiple-empty-lines': ['error'],

      // 禁止行尾空格
      'style/no-trailing-spaces': ['error'],

      // 禁止在属性前出现多余空格
      'style/no-whitespace-before-property': ['error'],

      // 操作符位置
      'style/operator-linebreak': ['error', 'after', {
        overrides: { '?': 'before', ':': 'before' },
      }],

      // 块内的空行
      'style/padded-blocks': ['error', 'never'],

      // 属性名的引号
      // 'style/quote-props': ['error', 'as-needed'],
    },
  },
)
