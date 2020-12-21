import {
  defineComponent,
  compile
} from 'vue'

import { PDFDocumentElement } from './elements'

import { 
  Text, 
  View
} from './components'
import { createApp } from './renderer'

const App = defineComponent({
  components: { Text, View },
  data() {
    return {
      colors: ['red', 'blue', 'green']
    }
  },
  render: compile(`
    <View>
      <View :styles="{color: 'red'}">
        <Text v-for="color in colors" :styles="{color, fontSize: color === 'blue' ? 25 : null}">
          {{ color }}
        </Text>
      </View>
      <Text>Default</Text>
      <Text :styles="{color: 'yellow'}">Yellow</Text>
      <Text :styles="{fontSize: 15}">Font size 15</Text>
      <Text :styles="{fontSize: 30}">Font size 30</Text>
      <View :styles="{align: 'center'}">
        <View :styles="{align: 'left'}">
          <Text>Left</Text>
        </View>
        <Text :styles="{fontSize: 45}">Center</Text>
        <Text :styles="{align: 'right'}">Right</Text>
      </View>
    </View>
  `)
})

const app = createApp(App)
app.mount(new PDFDocumentElement('Document'))