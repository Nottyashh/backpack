import {
  CHANNEL_SECURE_BACKGROUND_RESPONSE,
  CHANNEL_SECURE_UI_REQUEST,
  CHANNEL_SECURE_UI_RESPONSE,
} from "@coral-xyz/common";
import type {
  SECURE_EVENTS,
  SecureRequest,
  SecureResponse,
  TransportHandler,
  TransportReceiver,
} from "@coral-xyz/secure-background/types";
import { RequestResponder } from "packages/secure-background/src/transports/RequestResponder";

export class ToSecureUITransportReceiver<
  X extends SECURE_EVENTS,
  R extends "response" | "confirmation" = "response"
> implements TransportReceiver<X, R>
{
  constructor(private port: chrome.runtime.Port) {}

  public setHandler = (handler: TransportHandler<X, R>) => {
    const listener = (message: {
      channel: string;
      data: SecureRequest<X>[];
    }) => {
      if (message.channel !== CHANNEL_SECURE_UI_REQUEST) {
        return;
      }
      console.log("PCA message received", message.data);
      message.data.forEach((request) => {
        new RequestResponder({
          request,
          handler,
          onResponse: (result) => {
            this.sendResponse(request, result);
          },
        });
      });
    };
    this.port.onMessage.addListener(listener);
    return () => {
      this.port.onMessage.removeListener(listener);
    };
  };

  private sendResponse = (
    request: SecureRequest<X>,
    response: SecureResponse<X, R>
  ) => {
    console.log("PCA", "SEND_RESPONSE", request, response);
    this.port.postMessage({
      channel: CHANNEL_SECURE_UI_RESPONSE,
      data: {
        ...response,
        id: request.id,
      },
    });
  };
}
