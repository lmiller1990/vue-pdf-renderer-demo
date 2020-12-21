import {
  defineComponent,
  compile
} from 'vue'

import { PDFDocumentElement } from './elements'

import { 
  Text, 
  View,
  Image
} from './components'
import { createApp } from './renderer'
import { PDFStyleSheet } from './styling'

const styles: Record<string, PDFStyleSheet> = {
  header: {
    align: 'center'
  },
  title: {
    fontSize: 30
  },
  author: {
    fontSize: 15
  },
  text: {
    fontSize: 10
  }
}

const App = defineComponent({
  components: { Text, View, Image },
  data() {
    return {
      colors: ['red', 'blue', 'green'],
      styles
    }
  },
  render: compile(`
    <View>

      <View :styles="styles.header">
        <Text :styles="styles.title">
          Don Quijote de la Ma
        </Text>
        <Text :styles="styles.author">
          Miguel de Cervantes
        </Text>
      </View>

      <Image 
        src="./images/img.jpg" 
        width="300"
        :styles="{align: 'center'}"
      />

      <View>
        <Text :styles="styles.author">
          Capítulo I: Que trata de la condición y ejercicio del famoso hidalgo D. Quijote de la Manc
        </Text>
      </View>

      <View>
        <Text :styles="styles.text">
          En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha
          mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga
          antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que
          carnero, salpicón las más noches, duelos y quebrantos los sábados,
          lentejas los viernes, algún palomino de añadidura los domingos,
          consumían las tres partes de su hacienda. El resto della concluían sayo
          de velarte, calzas de velludo para las fiestas con sus pantuflos de lo
          mismo, los días de entre semana se honraba con su vellori de lo más
          fino. Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina
          que no llegaba a los veinte, y un mozo de campo y plaza, que así
          ensillaba el rocín como tomaba la podadera. Frisaba la edad de nuestro
          hidalgo con los cincuenta años, era de complexión recia, seco de carnes,
          enjuto de rostro; gran madrugador y amigo de la caza. Quieren decir que
          tenía el sobrenombre de Quijada o Quesada (que en esto hay alguna
          diferencia en los autores que deste caso escriben), aunque por
          conjeturas verosímiles se deja entender que se llama Quijana; pero esto
          importa poco a nuestro cuento; basta que en la narración dél no se salga
          un punto de la verdad.
        </Text>
      </View>

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
app.mount(new PDFDocumentElement('Document', { filename: './file.pdf' }))