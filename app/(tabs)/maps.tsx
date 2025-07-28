import EnhancedOpenSourceMap from "@/components/EnhancedOpenSourceMap"
import { StyleSheet, View } from "react-native"

export default function MapsTab() {
  return (
    <View style={styles.container}>
      <EnhancedOpenSourceMap />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Changed from transparent to ensure proper background
  },
})
