/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        canvas: {
          getRenderers() {
            return [
              {
                dataType: "car-model",
                url: '/#/metadata-editor'
              },
              {
                dataType: "customtype",
                url: '/#/metadata-editor',
              },
              {
                dataType: "preconcustomtype",
                url: '/#/precon-editor',
              },
              {
                dataType: "shopbylookcustomtype",
                url: '/#/shopbylook-editor',
              },
              {
                dataType: "techdatacustomfield",
                url: '/#/techdata-editor',
              }
            ];
          },
        },

      }
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>;
}

export default ExtensionRegistration;
