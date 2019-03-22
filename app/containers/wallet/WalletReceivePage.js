// @flow
import React, { Component } from 'react';
import { defineMessages, FormattedHTMLMessage } from 'react-intl';
import { observer } from 'mobx-react';
import { ellipsis } from '../../utils/strings';
import config from '../../config';
import WalletReceive from '../../components/wallet/WalletReceive';
import VerticalFlexContainer from '../../components/layout/VerticalFlexContainer';
import NotificationMessage from '../../components/widgets/NotificationMessage';
import HWAddressConfirmDialog from '../../components/wallet/receive/HWAddressConfirmDialog';
import successIcon from '../../assets/images/success-small.inline.svg';
import type { InjectedProps } from '../../types/injectedPropsType';

const messages = defineMessages({
  message: {
    id: 'wallet.receive.page.addressCopyNotificationMessage',
    defaultMessage: '!!!You have successfully copied wallet address',
  },
});

type Props = InjectedProps;

type State = {
  copiedAddress: string,
};

@observer
export default class WalletReceivePage extends Component<Props, State> {
  state = {
    copiedAddress: '',
  };

  componentWillUnmount() {
    this.closeNotification();
    this.resetErrors();
  }

  handleGenerateAddress = () => {
    const { wallets } = this.props.stores.substores.ada;
    const walletIsActive = !!wallets.active;
    if (walletIsActive) {
      this.props.actions.ada.addresses.createAddress.trigger();
    }
  };

  resetErrors = () => {
    this.props.actions.ada.addresses.resetErrors.trigger();
  };

  closeNotification = () => {
    const { wallets } = this.props.stores.substores.ada;
    const wallet = wallets.active;
    if (wallet) {
      const notificationId = `${wallet.id}-copyNotification`;
      this.props.actions.notifications.closeActiveNotification.trigger({ id: notificationId });
    }
  };

  render() {
    const { copiedAddress } = this.state;
    const actions = this.props.actions;
    const { uiNotifications, uiDialogs } = this.props.stores;
    const { wallets, addresses } = this.props.stores.substores.ada;
    const wallet = wallets.active;

    // Guard against potential null values
    if (!wallet) throw new Error('Active wallet required for WalletReceivePage.');

    // get info about the lattest address generated for special rendering
    const walletAddress = addresses.active ? addresses.active.id : '';
    const isWalletAddressUsed = addresses.active ? addresses.active.isUsed : false;

    const walletAddresses = addresses.all.reverse();

    const notification = {
      id: `${wallet.id}-copyNotification`,
      duration: config.wallets.ADDRESS_COPY_NOTIFICATION_DURATION,
      message: (
        <FormattedHTMLMessage
          {...messages.message}
          values={{ walletAddress: ellipsis(copiedAddress, 8) }}
        />
      ),
    };

    return (
      <VerticalFlexContainer>

        <NotificationMessage
          icon={successIcon}
          show={uiNotifications.isOpen(notification.id)}
        >
          {notification.message}
        </NotificationMessage>

        <WalletReceive
          walletAddress={walletAddress}
          isWalletAddressUsed={isWalletAddressUsed}
          walletAddresses={walletAddresses}
          onGenerateAddress={this.handleGenerateAddress}
          onCopyAddress={(address) => {
            this.setState({ copiedAddress: address });
            actions.notifications.open.trigger({
              id: notification.id,
              duration: notification.duration,
              message: messages.message
            });
          }}
          onVerifyAddress={({ address, path }) => {
            actions.ada.addresses.verifyAddress.trigger({ address, path });
            this.openVerifyAddressDialog();
          }}
          isSubmitting={addresses.createAddressRequest.isExecuting}
          error={addresses.error}
        />

        {uiDialogs.isOpen(HWAddressConfirmDialog) ? (
          <HWAddressConfirmDialog
            error={null}
            submit={() => actions.ada.addresses.closeVerifyAddressDialog.trigger()}
            cancel={() => actions.ada.addresses.closeVerifyAddressDialog.trigger()}
            walletAddress={addresses.verifyAddress.address}
            walletPath={addresses.verifyAddress.path}
          />
        ) : null}

      </VerticalFlexContainer>
    );
  }

  openVerifyAddressDialog = (): void => {
    const { actions } = this.props;
    actions.dialogs.open.trigger({ dialog: HWAddressConfirmDialog });
  }
}
