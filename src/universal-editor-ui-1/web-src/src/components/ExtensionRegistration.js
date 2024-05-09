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
        rightPanel: {
          addRails() {
            return [
              // @todo YOUR HEADER BUTTONS DECLARATION SHOULD BE HERE
              {
                extension: 'metadata-editor',
                id: 'metadata-editor',
                label: 'Metadata Editor',
                icon: 'FileGear',
                header: 'Metadata Editor',
                hotkey: 'M',
                url: "/index.html#/metadata-editor",
              }
            ];
          },
        },
        canvas: {
          getRenderers() {
            return [
              {
                dataType: "car-model",
                url: '/#/metadata-editor'
              },
              {
                dataType: "text",
                url: '/#/renderer/1',
              },
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
