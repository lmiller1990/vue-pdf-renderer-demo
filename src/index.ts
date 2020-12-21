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
    fontSize: 10,
    marginTop: 1,
  },
  image: {
    align: 'center',
    marginTop: 2,
    marginBottom: 2
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
        :styles="styles.image"
      />

      <View>
        <Text :styles="styles.author">
          Capítulo I: Que trata de la condición y ejercicio del famoso hidalgo D. Quijote de la Manc
        </Text>
      </View>

      <View :styles="styles.text">
        <Text>
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

      <View :styles="styles.text">
        <Text>
          Es, pues, de saber, que este sobredicho hidalgo, los ratos que estaba
          ocioso (que eran los más del año) se daba a leer libros de caballerías
          con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de
          la caza, y aun la administración de su hacienda; y llegó a tanto su
          curiosidad y desatino en esto, que vendió muchas hanegas de tierra de
          sembradura, para comprar libros de caballerías en que leer; y así llevó
          a su casa todos cuantos pudo haber dellos; y de todos ningunos le
          parecían tan bien como los que compuso el famoso Feliciano de Silva:
          porque la claridad de su prosa, y aquellas intrincadas razones suyas, le
          parecían de perlas; y más cuando llegaba a leer aquellos requiebros y
          cartas de desafío, donde en muchas partes hallaba escrito: la razón de
          la sinrazón que a mi razón se hace, de tal manera mi razón enflaquece,
          que con razón me quejo de la vuestra fermosura, y también cuando leía:
          los altos cielos que de vuestra divinidad divinamente con las estrellas
          se fortifican, y os hacen merecedora del merecimiento que merece la
          vuestra grandeza.        
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